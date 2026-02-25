const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const QUESTION_GEN_TIMEOUT_MS = Number(
  process.env.QUESTION_GEN_TIMEOUT_MS || 20000,
);
const MAX_GENERATION_ATTEMPTS = Number(
  process.env.QUESTION_GEN_MAX_RETRIES || 3,
);

const DIFFICULTY_TO_COUNT = {
  easy: 4,
  medium: 5,
  hard: 7,
};

const STOPWORDS = new Set([
  "about",
  "after",
  "all",
  "also",
  "and",
  "any",
  "are",
  "because",
  "been",
  "before",
  "being",
  "between",
  "both",
  "but",
  "can",
  "could",
  "data",
  "did",
  "does",
  "each",
  "for",
  "from",
  "have",
  "into",
  "its",
  "job",
  "just",
  "like",
  "more",
  "most",
  "not",
  "now",
  "our",
  "out",
  "over",
  "project",
  "role",
  "should",
  "skills",
  "some",
  "such",
  "than",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "under",
  "using",
  "very",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "would",
  "your",
  "you",
]);

const clampText = (value, maxChars) => (value || "").trim().slice(0, maxChars);

export const buildInterviewContext = ({ resumeText, jobDescription }) => {
  const resume = clampText(resumeText, 3000);
  const jd = clampText(jobDescription, 3000);

  let combined = resume.length + jd.length;
  if (combined <= 6000) {
    return { resume, jd, inputCharCount: combined };
  }

  const overBy = combined - 6000;
  const jdCut = Math.min(Math.ceil(overBy / 2), Math.max(jd.length - 500, 0));
  const resumeCut = Math.min(overBy - jdCut, Math.max(resume.length - 500, 0));

  const finalResume = resume.slice(0, Math.max(0, resume.length - resumeCut));
  const finalJd = jd.slice(0, Math.max(0, jd.length - jdCut));

  return {
    resume: finalResume,
    jd: finalJd,
    inputCharCount: finalResume.length + finalJd.length,
  };
};

export const getQuestionCountByDifficulty = (difficulty) =>
  DIFFICULTY_TO_COUNT[difficulty] || DIFFICULTY_TO_COUNT.medium;

const withTimeout = async (promiseFactory, timeoutMs, label) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await promiseFactory(controller.signal);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`${label} timed out.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const sanitizeJsonText = (value = "") =>
  value
    .replace(/^[\s`]*json\s*/i, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();

const parseStrictJsonArray = (content) => {
  const cleanedContent = sanitizeJsonText(content);
  const match = cleanedContent.match(/\[[\s\S]*\]/);
  if (!match) {
    throw new Error("No JSON array found in model response.");
  }

  const primary = match[0];

  try {
    const parsed = JSON.parse(primary);
    if (!Array.isArray(parsed)) {
      throw new Error("Model response must be a JSON array.");
    }
    return parsed;
  } catch {
    const repaired = primary
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/\r\n/g, "\n");

    const parsed = JSON.parse(repaired);
    if (!Array.isArray(parsed)) {
      throw new Error("Model response must be a JSON array.");
    }
    return parsed;
  }
};

const buildAnchors = (text, maxAnchors = 30) => {
  const map = new Map();
  const matches = (text || "").match(/[A-Za-z][A-Za-z0-9.+#-]{2,}/g) || [];

  for (const raw of matches) {
    const token = raw.trim();
    const key = token.toLowerCase();
    if (STOPWORDS.has(key)) continue;
    if (/^\d+$/.test(key)) continue;

    const current = map.get(key) || { token, count: 0 };
    current.count += 1;
    map.set(key, current);
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxAnchors)
    .map((x) => x.token);
};

export async function generateInterviewQuestions({
  resumeText,
  jobDescription,
  interviewType,
  difficulty,
  previousQuestions = [],
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const questionCount = getQuestionCountByDifficulty(difficulty);
  const context = buildInterviewContext({ resumeText, jobDescription });
  const resumeAnchors = buildAnchors(context.resume);
  const jdAnchors = buildAnchors(context.jd, 20);
  const allAnchors = Array.from(new Set([...resumeAnchors, ...jdAnchors]));
  const anchorHints = Array.from(
    new Set([...resumeAnchors, ...jdAnchors]),
  ).slice(0, 35);
  const recentQuestions = Array.from(
    new Set(
      (previousQuestions || [])
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
    ),
  ).slice(0, 8);

  const normalizeQuestion = (value) =>
    (value || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const tokenSet = (value) =>
    new Set(
      normalizeQuestion(value)
        .split(" ")
        .filter((token) => token.length > 2),
    );

  const similarity = (a, b) => {
    const setA = tokenSet(a);
    const setB = tokenSet(b);
    if (!setA.size || !setB.size) return 0;

    let overlap = 0;
    for (const token of setA) {
      if (setB.has(token)) overlap += 1;
    }

    return overlap / Math.max(setA.size, setB.size);
  };

  const isTooSimilar = (candidate, pool) => {
    const normalized = normalizeQuestion(candidate);
    if (!normalized) return true;

    return pool.some((existing) => {
      const normalizedExisting = normalizeQuestion(existing);
      if (!normalizedExisting) return false;
      if (normalized === normalizedExisting) return true;
      if (
        normalized.length > 40 &&
        normalizedExisting.length > 40 &&
        (normalized.includes(normalizedExisting) ||
          normalizedExisting.includes(normalized))
      ) {
        return true;
      }
      return similarity(normalized, normalizedExisting) >= 0.82;
    });
  };

  const systemPrompt = `You are a senior technical interviewer at a top-tier technology company (Google, Meta, Amazon level). Your task is to generate highly realistic, personalized mock interview questions.

<output_format>
You MUST respond with ONLY a valid JSON array. No markdown, no backticks, no explanations, no additional text.

Exact format required:
[{"text": "Your question here"}, {"text": "Another question here"}]

Generate EXACTLY ${questionCount} questions. Not ${questionCount - 1}, not ${questionCount + 1}. Exactly ${questionCount}.
</output_format>

<interview_context>
Interview Type: ${interviewType}
Difficulty Level: ${difficulty}
</interview_context>

<question_requirements>
1. PERSONALIZATION (Critical):
   - Every question MUST reference at least one SPECIFIC detail from the candidate's resume OR the job description
   - Acceptable specific details include: project names, company names, technologies, frameworks, metrics, achievements, team sizes, durations
   - Questions should feel like the interviewer has actually READ the candidate's background

2. QUESTION QUALITY:
   - Ask open-ended questions that probe depth of experience
   - Focus on: implementation details, design decisions, trade-offs, challenges overcome, lessons learned
   - Vary question angles: technical depth, system design, debugging, collaboration, leadership, problem-solving
   - Match the ${difficulty} difficulty level appropriately

3. REALISM:
   - Questions should sound natural, like a real interviewer would ask
   - Avoid textbook-style or trivia questions
   - Connect candidate's past experience to the target role's requirements

4. ABSOLUTE PROHIBITIONS:
   - NO generic questions that could apply to any candidate
   - NO questions about topics not mentioned in resume or JD
   - NO repetition of previously asked questions (see FORBIDDEN list below)
   - NO Wikipedia-style factual recall questions
</question_requirements>

<good_question_examples>
For a candidate who worked on "payment processing at Stripe":
✓ "You mentioned building payment processing systems at Stripe. What was the most challenging edge case you encountered with transaction failures, and how did you design the retry logic?"

For a candidate with "React and Node.js experience":
✓ "Your resume shows experience with both React and Node.js. In your e-commerce project, how did you handle state management between the frontend and your Node backend, especially for cart synchronization?"

For a JD requiring "distributed systems experience":
✓ "The role requires working with distributed systems. Based on your work at [Company], how would you approach designing a system that needs to handle [specific requirement from JD]?"
</good_question_examples>

<bad_question_examples>
✗ "What is React?" (too basic, no personalization)
✗ "Tell me about yourself" (too generic)
✗ "How does garbage collection work in Java?" (trivia, not personalized)
✗ "What are your strengths?" (not grounded in resume/JD)
</bad_question_examples>`;

  const userPrompt = `<interview_parameters>
TYPE: ${interviewType}
DIFFICULTY: ${difficulty}
QUESTION_COUNT: ${questionCount} (generate exactly this many)
</interview_parameters>

<grounding_anchors>
These specific terms/technologies MUST appear naturally in your questions (use at least one per question):
${anchorHints.length ? anchorHints.map((h) => `• ${h}`).join("\n") : "• (Extract relevant terms from resume and JD below)"}
</grounding_anchors>

<forbidden_questions>
DO NOT generate questions similar to these previously asked ones:
${recentQuestions.length ? recentQuestions.map((q, i) => `${i + 1}. "${q.trim()}"`).join("\n") : "(No previous questions - this is the first set)"}
</forbidden_questions>

<candidate_resume>
${context.resume?.trim() || "(No resume provided - focus on job description)"}
</candidate_resume>

<target_job_description>
${context.jd?.trim() || "(No job description provided - focus on resume)"}
</target_job_description>

<final_checklist>
Before outputting, verify:
✓ Exactly ${questionCount} questions in the array
✓ Each question references specific details from resume OR job description
✓ No question resembles the forbidden questions above
✓ Questions are ${difficulty}-level appropriate
✓ Output is ONLY the JSON array, nothing else
</final_checklist>

Generate the JSON array now:`;

  let normalizedQuestions = null;
  let latencyMs = 0;
  let lastGenerationError = null;

  for (
    let attempt = 1;
    attempt <= Math.max(1, MAX_GENERATION_ATTEMPTS);
    attempt += 1
  ) {
    try {
      const startTime = Date.now();
      const response = await withTimeout(
        (signal) =>
          fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: OPENROUTER_MODEL,
              temperature: Math.min(0.45, 0.2 + (attempt - 1) * 0.1),
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
            }),
            signal,
          }),
        QUESTION_GEN_TIMEOUT_MS,
        "Question generation provider",
      );
      latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `OpenRouter request failed: ${response.status} ${errorBody}`,
        );
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("OpenRouter returned empty content.");
      }

      const parsed = parseStrictJsonArray(content);
      if (parsed.length !== questionCount) {
        throw new Error(
          `Expected ${questionCount} questions, received ${parsed.length}.`,
        );
      }

      const candidateQuestions = parsed.map((item, index) => {
        const text = typeof item?.text === "string" ? item.text.trim() : "";
        if (!text) {
          throw new Error(
            "Each generated question must include non-empty text.",
          );
        }

        return {
          id: `q${index + 1}`,
          text,
          category: interviewType,
        };
      });

      const seenCurrent = [];
      for (const question of candidateQuestions) {
        if (isTooSimilar(question.text, seenCurrent)) {
          throw new Error(
            "Generated questions contain duplicates or close paraphrases.",
          );
        }
        seenCurrent.push(question.text);
      }

      if (recentQuestions.length > 0) {
        const exactRepeatCount = candidateQuestions.filter((question) =>
          recentQuestions.some(
            (existing) =>
              normalizeQuestion(existing) === normalizeQuestion(question.text),
          ),
        );
        if (exactRepeatCount.length > 0) {
          throw new Error(
            "Generated questions contain exact repeats from recent interview questions.",
          );
        }
      }

      if (allAnchors.length > 0) {
        const requiredGrounded = Math.max(1, Math.floor(questionCount / 2));
        const groundedCount = candidateQuestions.filter((q) => {
          const text = q.text.toLowerCase();
          return allAnchors.some((anchor) =>
            text.includes(anchor.toLowerCase()),
          );
        }).length;

        if (groundedCount < requiredGrounded) {
          throw new Error(
            "Generated questions are too generic and not grounded enough in resume details.",
          );
        }
      }

      normalizedQuestions = candidateQuestions;
      break;
    } catch (error) {
      lastGenerationError = error;
      if (attempt >= Math.max(1, MAX_GENERATION_ATTEMPTS)) {
        throw error;
      }
    }
  }

  if (!normalizedQuestions) {
    throw (
      lastGenerationError ||
      new Error("Failed to generate interview questions.")
    );
  }

  return {
    questions: normalizedQuestions,
    aiMeta: {
      model: OPENROUTER_MODEL,
      latencyMs,
      inputCharCount: context.inputCharCount,
      requestedCount: questionCount,
      returnedCount: normalizedQuestions.length,
      avoidedRecentCount: recentQuestions.length,
    },
  };
}
