import fs from "fs/promises";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import InterviewSession from "../models/interviewSession.js";
import User from "../models/user.js";
import { parseResumeFile } from "../utils/parseResume.js";
import { generateInterviewQuestions } from "../services/aiQuestionGenerator.js";

const VALID_TYPES = new Set(["technical", "behavioral", "case"]);
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const LOCK_TIMEOUT_MS = 120000;
const MAX_DURATION_SEC = 180;
const DEFAULT_TTS_TIMEOUT_MS = 15000;
const MAX_INTERVIEWS_PER_USER = 2;
const QUOTA_DISABLED =
  String(process.env.EVALIO_QD || "")
    .trim()
    .toLowerCase() === "true";

const PREMIUM_USER_IDS = new Set(
  String(process.env.EVALIO_PU || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

const PREMIUM_EMAILS = new Set(
  String(process.env.EVALIO_PE || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

const isPremiumUser = async (userId) => {
  if (QUOTA_DISABLED) return true;

  const normalizedUserId = String(userId || "").trim();
  if (PREMIUM_USER_IDS.has(normalizedUserId)) return true;

  if (PREMIUM_EMAILS.size === 0) return false;

  const user = await User.findById(userId).select("email").lean();
  const normalizedEmail = String(user?.email || "")
    .trim()
    .toLowerCase();

  if (!normalizedEmail) return false;
  return PREMIUM_EMAILS.has(normalizedEmail);
};

const toIntScore = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
};

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

const getEstimatedBitrateKbps = (mimeType = "") => {
  const value = mimeType.toLowerCase();
  if (value.includes("wav")) return 768;
  if (value.includes("mpeg") || value.includes("mp3")) return 128;
  if (value.includes("mp4") || value.includes("m4a") || value.includes("aac"))
    return 128;
  return 48;
};

const validateDurationAndSize = ({ durationSec, fileSize, mimeType }) => {
  if (
    !Number.isFinite(durationSec) ||
    durationSec <= 0 ||
    durationSec > MAX_DURATION_SEC
  ) {
    return "durationSec must be a number between 1 and 180 seconds.";
  }

  const bitrate = getEstimatedBitrateKbps(mimeType);
  const expectedBytes = (durationSec * bitrate * 1000) / 8;
  const minExpectedBytes = Math.max(4000, expectedBytes / 4);
  const maxExpectedBytes = expectedBytes * 4;

  if (fileSize < minExpectedBytes || fileSize > maxExpectedBytes) {
    return "Audio duration is inconsistent with uploaded file size.";
  }

  return null;
};

const FILLER_WORDS = [
  "uh",
  "um",
  "like",
  "you know",
  "actually",
  "basically",
  "so",
];

const computeSpeechMetrics = ({ transcript, durationSec }) => {
  const words = (transcript.match(/\b[\w'-]+\b/g) || []).map((w) =>
    w.toLowerCase(),
  );
  const wordCount = words.length;
  const fillerWordCount = words.filter((w) => FILLER_WORDS.includes(w)).length;
  const wordsPerMinute =
    durationSec > 0 ? Number(((wordCount / durationSec) * 60).toFixed(2)) : 0;
  const pauseCount = Math.max(0, Math.round(durationSec / 12) - 1);
  const disfluencyRatio =
    wordCount > 0
      ? Number(((fillerWordCount + pauseCount) / wordCount).toFixed(3))
      : 1;

  const shortAnswerPenalty =
    wordCount < 20 ? Math.min(40, (20 - wordCount) * 2) : 0;
  const tooFastOrTooSlowPenalty =
    wordsPerMinute > 185 || wordsPerMinute < 70 ? 12 : 0;
  const fluencyPenalty = Math.min(
    70,
    fillerWordCount * 3 +
      pauseCount * 2 +
      shortAnswerPenalty +
      tooFastOrTooSlowPenalty,
  );
  const speechFlowPenalty = Math.min(
    75,
    Math.round(disfluencyRatio * 100) +
      shortAnswerPenalty +
      tooFastOrTooSlowPenalty,
  );

  return {
    wordCount,
    fillerWordCount,
    pauseCount,
    wordsPerMinute,
    disfluencyRatio,
    fluencyScore: toIntScore(100 - fluencyPenalty),
    speechFlowScore: toIntScore(100 - speechFlowPenalty),
  };
};

const buildOverallScore = ({
  relevance,
  technicalDepth,
  clarity,
  fluency,
  speechFlowScore,
}) =>
  toIntScore(
    0.35 * relevance +
      0.3 * technicalDepth +
      0.2 * clarity +
      0.1 * fluency +
      0.05 * speechFlowScore,
  );

const getSessionOverallScore = (answers = []) => {
  if (!Array.isArray(answers) || answers.length === 0) {
    return 0;
  }

  const validOverall = answers
    .map((answer) => Number(answer?.scores?.overall))
    .filter((value) => Number.isFinite(value));

  if (validOverall.length > 0) {
    return toIntScore(
      Math.round(
        validOverall.reduce((acc, value) => acc + value, 0) /
          validOverall.length,
      ),
    );
  }

  const scoreTotals = answers.reduce(
    (acc, answer) => {
      acc.relevance += Number(answer?.scores?.relevance || 0);
      acc.technicalDepth += Number(answer?.scores?.technicalDepth || 0);
      acc.clarity += Number(answer?.scores?.clarity || 0);
      acc.fluency += Number(answer?.scores?.fluency || 0);
      acc.speechFlowScore += Number(answer?.scores?.speechFlowScore || 0);
      return acc;
    },
    {
      relevance: 0,
      technicalDepth: 0,
      clarity: 0,
      fluency: 0,
      speechFlowScore: 0,
    },
  );

  const count = answers.length;
  return buildOverallScore({
    relevance: Math.round(scoreTotals.relevance / count),
    technicalDepth: Math.round(scoreTotals.technicalDepth / count),
    clarity: Math.round(scoreTotals.clarity / count),
    fluency: Math.round(scoreTotals.fluency / count),
    speechFlowScore: Math.round(scoreTotals.speechFlowScore / count),
  });
};

const isSessionCompleted = (session) => {
  const total = Array.isArray(session?.generatedQuestions)
    ? session.generatedQuestions.length
    : 0;
  const answered = Array.isArray(session?.answers) ? session.answers.length : 0;
  return total > 0 && answered === total;
};

const getFallbackOverallScore = (answers = []) => {
  if (!Array.isArray(answers) || answers.length === 0) return null;

  const scoreTotals = answers.reduce(
    (acc, answer) => {
      const relevance = Number(answer?.scores?.relevance);
      const technicalDepth = Number(answer?.scores?.technicalDepth);
      const clarity = Number(answer?.scores?.clarity);
      const fluency = Number(answer?.scores?.fluency);
      const speechFlowScore = Number(answer?.scores?.speechFlowScore);

      if (
        !Number.isFinite(relevance) ||
        !Number.isFinite(technicalDepth) ||
        !Number.isFinite(clarity) ||
        !Number.isFinite(fluency) ||
        !Number.isFinite(speechFlowScore)
      ) {
        return null;
      }

      acc.relevance += relevance;
      acc.technicalDepth += technicalDepth;
      acc.clarity += clarity;
      acc.fluency += fluency;
      acc.speechFlowScore += speechFlowScore;
      return acc;
    },
    {
      relevance: 0,
      technicalDepth: 0,
      clarity: 0,
      fluency: 0,
      speechFlowScore: 0,
    },
  );

  if (!scoreTotals) return null;

  const count = answers.length;
  return buildOverallScore({
    relevance: Math.round(scoreTotals.relevance / count),
    technicalDepth: Math.round(scoreTotals.technicalDepth / count),
    clarity: Math.round(scoreTotals.clarity / count),
    fluency: Math.round(scoreTotals.fluency / count),
    speechFlowScore: Math.round(scoreTotals.speechFlowScore / count),
  });
};

const getHistorySessionOverallScore = (answers = []) => {
  if (!Array.isArray(answers) || answers.length === 0) return null;

  const hasMissingScores = answers.some((answer) => !answer?.scores);
  if (hasMissingScores) return null;

  const hasAnyMissingOverall = answers.some(
    (answer) => !Number.isFinite(Number(answer?.scores?.overall)),
  );

  if (!hasAnyMissingOverall) {
    return toIntScore(
      Math.round(
        answers.reduce(
          (sum, answer) => sum + Number(answer.scores.overall),
          0,
        ) / answers.length,
      ),
    );
  }

  return getFallbackOverallScore(answers);
};

const transcribeWithDeepgram = async ({ filePath, mimeType }) => {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY is not configured.");
  }

  const audioBuffer = await fs.readFile(filePath);
  const startedAt = Date.now();
  const response = await withTimeout(
    (signal) =>
      fetch(
        "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${apiKey}`,
            "Content-Type": mimeType || "audio/webm",
          },
          body: audioBuffer,
          signal,
        },
      ),
    20000,
    "Transcription provider",
  );
  const transcriptionMs = Date.now() - startedAt;

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Deepgram request failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  const transcript =
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() || "";
  const confidence = Number(
    data?.results?.channels?.[0]?.alternatives?.[0]?.confidence ?? 0,
  );

  if (!transcript) {
    throw new Error("Transcription returned empty transcript.");
  }

  return { transcript, confidence, transcriptionMs };
};

const synthesizeSpeechWithDeepgram = async ({ text }) => {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY is not configured.");
  }

  const model = process.env.DEEPGRAM_TTS_MODEL || "aura-2-thalia-en";
  const timeoutMs = Number(
    process.env.TTS_TIMEOUT_MS || DEFAULT_TTS_TIMEOUT_MS,
  );
  const endpoint = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`;

  const response = await withTimeout(
    (signal) =>
      fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({ text }),
        signal,
      }),
    timeoutMs,
    "TTS provider",
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Deepgram TTS request failed: ${response.status} ${body}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const evaluateAnswerWithLLM = async ({
  questionText,
  transcript,
  interviewType,
  difficulty,
}) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  const systemPrompt = [
    "You evaluate interview answers.",
    "Return ONLY valid JSON.",
    "No markdown, no explanation, no backticks.",
    "Required schema:",
    '{"relevance":0,"technicalDepth":0,"clarity":0,"strongPoints":[""],"weakPoints":[""],"feedback":""}',
    "All score fields must be numbers from 0 to 100.",
  ].join("\n");

  const userPrompt = [
    `Interview Type: ${interviewType}`,
    `Difficulty: ${difficulty}`,
    `Question: ${questionText}`,
    "Candidate Answer:",
    transcript,
  ].join("\n");

  const startedAt = Date.now();
  const response = await withTimeout(
    (signal) =>
      fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
        signal,
      }),
    25000,
    "Evaluation provider",
  );
  const evaluationMs = Date.now() - startedAt;

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenRouter evaluation request failed: ${response.status} ${body}`,
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Evaluation provider returned empty content.");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Evaluation provider response was not valid JSON.");
  }

  return {
    relevance: toIntScore(parsed?.relevance),
    technicalDepth: toIntScore(parsed?.technicalDepth),
    clarity: toIntScore(parsed?.clarity),
    strongPoints: Array.isArray(parsed?.strongPoints)
      ? parsed.strongPoints
          .filter((x) => typeof x === "string" && x.trim())
          .slice(0, 5)
      : [],
    weakPoints: Array.isArray(parsed?.weakPoints)
      ? parsed.weakPoints
          .filter((x) => typeof x === "string" && x.trim())
          .slice(0, 5)
      : [],
    feedback:
      typeof parsed?.feedback === "string" ? parsed.feedback.trim() : "",
    evaluationMs,
  };
};

export const startInterview = async (req, res) => {
  try {
    const { jd, type = "behavioral", difficulty = "medium" } = req.body;
    const { file } = req;
    const interviewType = String(type).trim().toLowerCase();
    const normalizedDifficulty = String(difficulty).trim().toLowerCase();

    if (!file) {
      return res.status(400).json({ message: "Resume file is required." });
    }

    if (!jd || !jd.trim()) {
      return res.status(400).json({ message: "Job description is required." });
    }

    if (!VALID_TYPES.has(interviewType)) {
      return res.status(400).json({
        message:
          "Invalid interview type. Allowed values: technical, behavioral, case.",
      });
    }

    if (!VALID_DIFFICULTIES.has(normalizedDifficulty)) {
      return res.status(400).json({
        message: "Invalid difficulty. Allowed values: easy, medium, hard.",
      });
    }

    const hasPremiumAccess = await isPremiumUser(req.user);

    if (!hasPremiumAccess) {
      const user = await User.findById(req.user)
        .select("totalInterviewsCreated")
        .lean();

      let totalCreated = user?.totalInterviewsCreated ?? null;

      if (totalCreated === null) {
        const existingCount = await InterviewSession.countDocuments({
          user: req.user,
        });
        await User.findByIdAndUpdate(req.user, {
          totalInterviewsCreated: existingCount,
        });
        totalCreated = existingCount;
      }

      if (totalCreated >= MAX_INTERVIEWS_PER_USER) {
        if (file?.path) {
          await fs.unlink(file.path).catch(() => null);
        }

        return res.status(403).json({
          message: `Interview limit reached. You can only create ${MAX_INTERVIEWS_PER_USER} interviews per account.`,
          code: "INTERVIEW_LIMIT_REACHED",
          maxInterviews: MAX_INTERVIEWS_PER_USER,
        });
      }
    }

    let parsedResumeText = "";
    try {
      parsedResumeText = await parseResumeFile(file.path);
    } catch (parseErr) {
      await fs.unlink(file.path).catch(() => null);
      return res
        .status(400)
        .json({ message: parseErr.message || "Failed to parse resume file." });
    }

    let aiResult;
    try {
      const recentSessions = await InterviewSession.find({
        user: req.user,
        interviewType,
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("generatedQuestions.text")
        .lean();

      const previousQuestions = recentSessions.flatMap((session) =>
        (session.generatedQuestions || [])
          .map((question) => String(question?.text || "").trim())
          .filter(Boolean),
      );

      aiResult = await generateInterviewQuestions({
        resumeText: parsedResumeText,
        jobDescription: jd,
        interviewType,
        difficulty: normalizedDifficulty,
        previousQuestions,
      });
    } catch (aiError) {
      await fs.unlink(file.path).catch(() => null);
      console.error("Interview question generation failed:", {
        userId: req.user,
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        reason: aiError.message,
      });
      return res
        .status(502)
        .json({ message: "Question generation failed. Please retry." });
    }

    const session = await InterviewSession.create({
      user: req.user,
      jobDescription: jd,
      interviewType,
      difficulty: normalizedDifficulty,
      resumeFile: {
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: file.path,
      },
      parsedResumeText,
      generatedQuestions: aiResult.questions,
      aiMeta: aiResult.aiMeta,
    });

    await User.findByIdAndUpdate(req.user, {
      $inc: { totalInterviewsCreated: 1 },
    });

    console.info("Interview session created", {
      userId: req.user,
      sessionId: String(session._id),
      model: aiResult.aiMeta.model,
      latencyMs: aiResult.aiMeta.latencyMs,
      inputCharCount: aiResult.aiMeta.inputCharCount,
      questionCount: aiResult.aiMeta.returnedCount,
      avoidedRecentCount: aiResult.aiMeta.avoidedRecentCount || 0,
    });

    return res.status(201).json({
      message: "Interview session created successfully.",
      sessionId: session._id,
      resume: {
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      questions: session.generatedQuestions,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Failed to start interview." });
  }
};

export const getInterviewSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session id." });
    }

    const session = await InterviewSession.findById(sessionId).lean();
    if (!session) {
      return res.status(404).json({ message: "Interview session not found." });
    }

    if (String(session.user) !== String(req.user)) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this session." });
    }

    const user = await User.findById(session.user).select("name").lean();
    const userName = user?.name || "there";

    const answeredQuestionIds = (session.answers || []).map(
      (a) => a.questionId,
    );
    return res.json({
      sessionId: session._id,
      interviewType: session.interviewType,
      difficulty: session.difficulty,
      status: session.status,
      createdAt: session.createdAt,
      questions: session.generatedQuestions,
      answeredCount: answeredQuestionIds.length,
      answeredQuestionIds,
      userName,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Failed to fetch interview session." });
  }
};

export const synthesizeInterviewQuestionAudio = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, text } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session id." });
    }

    if (!questionId || typeof questionId !== "string") {
      return res.status(400).json({ message: "questionId is required." });
    }

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ message: "Question text is required." });
    }

    const session = await InterviewSession.findById(sessionId).lean();
    if (!session) {
      return res.status(404).json({ message: "Interview session not found." });
    }

    if (String(session.user) !== String(req.user)) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this session." });
    }

    let canonicalText;

    if (questionId === "greeting") {
      canonicalText = text.trim();
    } else {
      const question = (session.generatedQuestions || []).find(
        (q) => q.id === questionId,
      );
      if (!question) {
        return res
          .status(400)
          .json({ message: "Invalid questionId for this session." });
      }

      canonicalText = String(question.text || "").trim();
      if (!canonicalText) {
        return res
          .status(400)
          .json({ message: "Question text is not available." });
      }

      if (text.trim() !== canonicalText) {
        return res
          .status(400)
          .json({ message: "Question text does not match session question." });
      }
    }

    try {
      const audioBuffer = await synthesizeSpeechWithDeepgram({
        text: canonicalText,
      });
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "private, max-age=300");
      return res.status(200).send(audioBuffer);
    } catch (providerError) {
      console.error("Question TTS failed:", {
        userId: req.user,
        sessionId,
        questionId,
        reason: providerError.message,
      });
      return res
        .status(502)
        .json({ message: "Question audio generation failed." });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to synthesize question audio.",
    });
  }
};

export const submitInterviewAnswer = async (req, res) => {
  const requestId = randomUUID();
  const { sessionId } = req.params;
  const { questionId } = req.body;
  const durationSec = Number(req.body.durationSec);
  const { file } = req;
  let lockAcquired = false;

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ message: "Invalid session id." });
  }

  if (!questionId || typeof questionId !== "string") {
    return res.status(400).json({ message: "questionId is required." });
  }

  if (!file) {
    return res.status(400).json({ message: "Audio file is required." });
  }

  const durationError = validateDurationAndSize({
    durationSec,
    fileSize: file.size,
    mimeType: file.mimetype,
  });
  if (durationError) {
    await fs.unlink(file.path).catch(() => null);
    return res.status(400).json({ message: durationError });
  }

  try {
    const baseSession = await InterviewSession.findById(sessionId).lean();
    if (!baseSession) {
      await fs.unlink(file.path).catch(() => null);
      return res.status(404).json({ message: "Interview session not found." });
    }

    if (String(baseSession.user) !== String(req.user)) {
      await fs.unlink(file.path).catch(() => null);
      return res
        .status(403)
        .json({ message: "Not authorized to access this session." });
    }

    const question = (baseSession.generatedQuestions || []).find(
      (q) => q.id === questionId,
    );
    if (!question) {
      await fs.unlink(file.path).catch(() => null);
      return res
        .status(400)
        .json({ message: "Invalid questionId for this session." });
    }

    const existing = (baseSession.answers || []).find(
      (a) => a.questionId === questionId,
    );
    if (existing) {
      await fs.unlink(file.path).catch(() => null);
      return res.status(200).json({
        status: "already_evaluated",
        questionId,
        answerId: existing._id,
        transcript: existing.transcript,
        scores: existing.scores,
        strongPoints: existing.strongPoints,
        weakPoints: existing.weakPoints,
        feedback: existing.feedback,
        speechMetrics: existing.speechMetrics,
        aiMeta: existing.aiMeta,
      });
    }

    const staleBefore = new Date(Date.now() - LOCK_TIMEOUT_MS);
    await InterviewSession.updateOne(
      { _id: sessionId },
      {
        $pull: {
          processingLocks: { questionId, startedAt: { $lt: staleBefore } },
        },
      },
    );

    const lockResult = await InterviewSession.findOneAndUpdate(
      {
        _id: sessionId,
        user: req.user,
        answers: { $not: { $elemMatch: { questionId } } },
        processingLocks: { $not: { $elemMatch: { questionId } } },
      },
      {
        $push: {
          processingLocks: {
            questionId,
            startedAt: new Date(),
            requestId,
          },
        },
      },
      { returnDocument: "after", projection: { _id: 1 } },
    );

    if (!lockResult) {
      const sessionWithAnswer =
        await InterviewSession.findById(sessionId).lean();
      const maybeExisting = (sessionWithAnswer?.answers || []).find(
        (a) => a.questionId === questionId,
      );
      if (maybeExisting) {
        await fs.unlink(file.path).catch(() => null);
        return res.status(200).json({
          status: "already_evaluated",
          questionId,
          answerId: maybeExisting._id,
          transcript: maybeExisting.transcript,
          scores: maybeExisting.scores,
          strongPoints: maybeExisting.strongPoints,
          weakPoints: maybeExisting.weakPoints,
          feedback: maybeExisting.feedback,
          speechMetrics: maybeExisting.speechMetrics,
          aiMeta: maybeExisting.aiMeta,
        });
      }

      await fs.unlink(file.path).catch(() => null);
      return res.status(202).json({
        status: "processing",
        message: "Answer is being processed. Retry in a few seconds.",
      });
    }
    lockAcquired = true;

    const { transcript, confidence, transcriptionMs } =
      await transcribeWithDeepgram({
        filePath: file.path,
        mimeType: file.mimetype,
      });

    const metrics = computeSpeechMetrics({ transcript, durationSec });
    if (metrics.wordCount < 8 || confidence < 0.45) {
      return res.status(400).json({
        message:
          "Audio quality is too low to evaluate. Please re-record your answer clearly.",
      });
    }

    const evalResult = await evaluateAnswerWithLLM({
      questionText: question.text,
      transcript,
      interviewType: baseSession.interviewType,
      difficulty: baseSession.difficulty,
    });

    const scores = {
      relevance: evalResult.relevance,
      technicalDepth: evalResult.technicalDepth,
      clarity: evalResult.clarity,
      fluency: metrics.fluencyScore,
      speechFlowScore: metrics.speechFlowScore,
      overall: buildOverallScore({
        relevance: evalResult.relevance,
        technicalDepth: evalResult.technicalDepth,
        clarity: evalResult.clarity,
        fluency: metrics.fluencyScore,
        speechFlowScore: metrics.speechFlowScore,
      }),
    };

    const finalCheck = await InterviewSession.findById(sessionId).lean();
    const raceExisting = (finalCheck?.answers || []).find(
      (a) => a.questionId === questionId,
    );
    if (raceExisting) {
      return res.status(200).json({
        status: "already_evaluated",
        questionId,
        answerId: raceExisting._id,
        transcript: raceExisting.transcript,
        scores: raceExisting.scores,
        strongPoints: raceExisting.strongPoints,
        weakPoints: raceExisting.weakPoints,
        feedback: raceExisting.feedback,
        speechMetrics: raceExisting.speechMetrics,
        aiMeta: raceExisting.aiMeta,
      });
    }

    const persisted = await InterviewSession.findOneAndUpdate(
      {
        _id: sessionId,
        user: req.user,
        answers: { $not: { $elemMatch: { questionId } } },
        processingLocks: { $elemMatch: { questionId, requestId } },
      },
      {
        $push: {
          answers: {
            questionId,
            durationSec,
            transcript,
            audioFile: {
              originalName: file.originalname,
              storedName: file.filename,
              mimeType: file.mimetype,
              size: file.size,
              storagePath: file.path,
            },
            speechMetrics: {
              wordCount: metrics.wordCount,
              fillerWordCount: metrics.fillerWordCount,
              pauseCount: metrics.pauseCount,
              wordsPerMinute: metrics.wordsPerMinute,
              disfluencyRatio: metrics.disfluencyRatio,
            },
            scores,
            strongPoints: evalResult.strongPoints,
            weakPoints: evalResult.weakPoints,
            feedback: evalResult.feedback,
            aiMeta: {
              transcriptionMs,
              evaluationMs: evalResult.evaluationMs,
            },
          },
        },
        $pull: { processingLocks: { questionId, requestId } },
      },
      { returnDocument: "after", projection: { answers: 1 } },
    );

    if (!persisted) {
      throw new Error("Failed to persist evaluated answer.");
    }

    lockAcquired = false;
    const saved = (persisted.answers || []).find(
      (a) => a.questionId === questionId,
    );
    return res.status(201).json({
      status: "evaluated",
      questionId,
      answerId: saved?._id,
      transcript,
      scores,
      strongPoints: evalResult.strongPoints,
      weakPoints: evalResult.weakPoints,
      feedback: evalResult.feedback,
      speechMetrics: {
        wordCount: metrics.wordCount,
        fillerWordCount: metrics.fillerWordCount,
        pauseCount: metrics.pauseCount,
        wordsPerMinute: metrics.wordsPerMinute,
        disfluencyRatio: metrics.disfluencyRatio,
      },
      aiMeta: {
        transcriptionMs,
        evaluationMs: evalResult.evaluationMs,
      },
    });
  } catch (error) {
    await fs.unlink(file.path).catch(() => null);
    console.error("Answer submission/evaluation failed:", {
      userId: req.user,
      sessionId,
      questionId,
      reason: error.message,
    });

    if (error?.message === "Transcription returned empty transcript.") {
      return res.status(400).json({
        message:
          "We could not hear your answer clearly. Please speak clearly and record your response again.",
      });
    }

    return res
      .status(502)
      .json({ message: "Answer evaluation failed. Please retry." });
  } finally {
    if (lockAcquired) {
      await InterviewSession.updateOne(
        { _id: sessionId, user: req.user },
        { $pull: { processingLocks: { questionId, requestId } } },
      ).catch(() => null);
    }
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const hasPremiumAccess = await isPremiumUser(req.user);
    const sessions = await InterviewSession.find({ user: req.user })
      .sort({ createdAt: -1 })
      .lean();

    const user = await User.findById(req.user)
      .select("totalInterviewsCreated")
      .lean();

    let totalCreated = user?.totalInterviewsCreated ?? null;
    if (totalCreated === null) {
      totalCreated = sessions.length;
      await User.findByIdAndUpdate(req.user, {
        totalInterviewsCreated: totalCreated,
      });
    }

    const interviewsUsed = totalCreated;
    const interviewsRemaining = hasPremiumAccess
      ? null
      : Math.max(0, MAX_INTERVIEWS_PER_USER - interviewsUsed);

    const completedSessions = sessions
      .map((session) => {
        const totalQuestions = Array.isArray(session.generatedQuestions)
          ? session.generatedQuestions.length
          : 0;
        const answeredCount = Array.isArray(session.answers)
          ? session.answers.length
          : 0;
        const isCompleted =
          totalQuestions > 0 && answeredCount === totalQuestions;

        return {
          isCompleted,
          sessionId: String(session._id),
          interviewType: session.interviewType,
          difficulty: session.difficulty,
          createdAt: session.createdAt,
          answeredCount,
          totalQuestions,
          overallScore: getSessionOverallScore(session.answers || []),
        };
      })
      .filter((session) => session.isCompleted);

    const interviewsCompleted = completedSessions.length;
    const averageScore =
      interviewsCompleted > 0
        ? Math.round(
            completedSessions.reduce(
              (acc, session) => acc + session.overallScore,
              0,
            ) / interviewsCompleted,
          )
        : 0;

    const recentSessions = completedSessions.slice(0, 3).map((session) => ({
      sessionId: session.sessionId,
      interviewType: session.interviewType,
      difficulty: session.difficulty,
      createdAt: session.createdAt,
      overallScore: session.overallScore,
      answeredCount: session.answeredCount,
      totalQuestions: session.totalQuestions,
    }));

    return res.json({
      averageScore,
      interviewsCompleted,
      interviewsUsed,
      interviewsRemaining,
      maxInterviewsAllowed: MAX_INTERVIEWS_PER_USER,
      isPremiumUser: hasPremiumAccess,
      recentSessions,
      latestCompletedSessionId: recentSessions[0]?.sessionId || null,
    });
  } catch (error) {
    console.error("Dashboard summary failed:", {
      userId: req.user,
      reason: error.message,
    });
    return res
      .status(500)
      .json({ message: "Failed to fetch dashboard summary." });
  }
};

export const getInterviewHistory = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ user: req.user })
      .sort({ createdAt: -1 })
      .lean();

    const rows = sessions
      .map((session) => {
        const completed = isSessionCompleted(session);

        const totalQuestions = Array.isArray(session.generatedQuestions)
          ? session.generatedQuestions.length
          : 0;
        const answeredCount = Array.isArray(session.answers)
          ? session.answers.length
          : 0;
        const overallScore = completed
          ? getHistorySessionOverallScore(session.answers || [])
          : 0;

        const answers = Array.isArray(session.answers)
          ? session.answers.map((a) => ({
              questionId: a.questionId,
              scores: a.scores || {},
            }))
          : [];

        return {
          sessionId: String(session._id),
          interviewType: session.interviewType,
          difficulty: session.difficulty,
          createdAt: session.createdAt,
          answeredCount,
          totalQuestions,
          overallScore: Number.isFinite(Number(overallScore))
            ? Number(overallScore)
            : 0,
          status: completed ? "Completed" : "In Progress",
          answers,
        };
      })
      .filter(Boolean);

    return res.json({
      sessions: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("Interview history failed:", {
      userId: req.user,
      reason: error.message,
    });
    return res
      .status(500)
      .json({ message: "Failed to fetch interview history." });
  }
};

export const getInterviewReport = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session id." });
    }

    const session = await InterviewSession.findById(sessionId).lean();
    if (!session) {
      return res.status(404).json({ message: "Interview session not found." });
    }

    if (String(session.user) !== String(req.user)) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this session." });
    }

    const answers = Array.isArray(session.answers) ? session.answers : [];
    const questionMap = new Map(
      (session.generatedQuestions || []).map((q) => [q.id, q.text || ""]),
    );
    if (answers.length === 0) {
      return res.json({
        sessionId: session._id,
        interviewType: session.interviewType,
        difficulty: session.difficulty,
        createdAt: session.createdAt,
        answeredCount: 0,
        totalQuestions: (session.generatedQuestions || []).length,
        overallScore: 0,
        scores: {
          relevance: 0,
          technicalDepth: 0,
          clarity: 0,
          fluency: 0,
          speechFlowScore: 0,
        },
        strongPoints: [],
        weakPoints: [],
        answers: [],
      });
    }

    const sum = answers.reduce(
      (acc, answer) => {
        acc.relevance += answer?.scores?.relevance || 0;
        acc.technicalDepth += answer?.scores?.technicalDepth || 0;
        acc.clarity += answer?.scores?.clarity || 0;
        acc.fluency += answer?.scores?.fluency || 0;
        acc.speechFlowScore += answer?.scores?.speechFlowScore || 0;
        return acc;
      },
      {
        relevance: 0,
        technicalDepth: 0,
        clarity: 0,
        fluency: 0,
        speechFlowScore: 0,
      },
    );

    const count = answers.length;
    const avgScores = {
      relevance: Math.round(sum.relevance / count),
      technicalDepth: Math.round(sum.technicalDepth / count),
      clarity: Math.round(sum.clarity / count),
      fluency: Math.round(sum.fluency / count),
      speechFlowScore: Math.round(sum.speechFlowScore / count),
    };
    const overallScore = Math.round(
      0.35 * avgScores.relevance +
        0.3 * avgScores.technicalDepth +
        0.2 * avgScores.clarity +
        0.1 * avgScores.fluency +
        0.05 * avgScores.speechFlowScore,
    );

    const strongPoints = [
      ...new Set(answers.flatMap((a) => a.strongPoints || [])),
    ].slice(0, 8);
    const weakPoints = [
      ...new Set(answers.flatMap((a) => a.weakPoints || [])),
    ].slice(0, 8);

    return res.json({
      sessionId: session._id,
      interviewType: session.interviewType,
      difficulty: session.difficulty,
      createdAt: session.createdAt,
      answeredCount: count,
      totalQuestions: (session.generatedQuestions || []).length,
      overallScore,
      scores: avgScores,
      strongPoints,
      weakPoints,
      answers: answers.map((answer) => ({
        questionId: answer.questionId,
        questionText: questionMap.get(answer.questionId) || "",
        transcript: answer.transcript,
        scores: answer.scores,
        strongPoints: answer.strongPoints || [],
        weakPoints: answer.weakPoints || [],
        feedback: answer.feedback || "",
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Failed to fetch interview report." });
  }
};

export const deleteInterviewSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session id." });
    }

    const session = await InterviewSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Interview session not found." });
    }

    if (String(session.user) !== String(req.user)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own interview sessions." });
    }

    const filesToDelete = [];

    if (session.resumeFile?.storagePath) {
      filesToDelete.push(session.resumeFile.storagePath);
    }

    if (Array.isArray(session.answers)) {
      for (const answer of session.answers) {
        if (answer.audioFile?.storagePath) {
          filesToDelete.push(answer.audioFile.storagePath);
        }
      }
    }

    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn(`Failed to delete file ${filePath}:`, err.message);
      }
    }

    await InterviewSession.findByIdAndDelete(sessionId);

    return res.json({
      message: "Interview session deleted successfully.",
      sessionId,
    });
  } catch (error) {
    console.error("Delete interview session failed:", {
      userId: req.user,
      sessionId: req.params.sessionId,
      reason: error.message,
    });
    return res
      .status(500)
      .json({ message: "Failed to delete interview session." });
  }
};
