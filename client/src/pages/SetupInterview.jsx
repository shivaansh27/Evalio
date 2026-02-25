import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, Code, Users, Briefcase } from "lucide-react";
import Button from "../components/Button";
import { apiFetch } from "../lib/api";
import { useToast } from "../context/ToastContext";

export default function SetupInterview() {
  const navigate = useNavigate();
  const toast = useToast();
  const [selectedType, setSelectedType] = useState("behavioral");
  const [difficulty, setDifficulty] = useState("medium");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewsUsed, setInterviewsUsed] = useState(0);
  const [interviewsRemaining, setInterviewsRemaining] = useState(2);
  const [maxInterviewsAllowed, setMaxInterviewsAllowed] = useState(2);
  const [isInterviewLimitBypassed, setIsInterviewLimitBypassed] =
    useState(false);

  const interviewTypes = [
    {
      id: "behavioral",
      icon: Users,
      label: "Behavioral",
      desc: "Focus on past experiences and soft skills.",
    },
    {
      id: "technical",
      icon: Code,
      label: "Technical",
      desc: "Coding, system design, and technical concepts.",
    },
    {
      id: "case",
      icon: Briefcase,
      label: "Case Study",
      desc: "Problem-solving and business acumen.",
    },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadQuota = async () => {
      try {
        const response = await apiFetch("/api/interview/dashboard/summary");
        const data = await response.json();

        if (!response.ok || !isMounted) return;

        const used = Number.isFinite(Number(data?.interviewsUsed))
          ? Number(data.interviewsUsed)
          : 0;
        const maxAllowed = Number.isFinite(Number(data?.maxInterviewsAllowed))
          ? Number(data.maxInterviewsAllowed)
          : 2;
        const remaining = Number.isFinite(Number(data?.interviewsRemaining))
          ? Number(data.interviewsRemaining)
          : Math.max(0, maxAllowed - used);

        setInterviewsUsed(used);
        setMaxInterviewsAllowed(maxAllowed);
        setInterviewsRemaining(Math.max(0, remaining));
        setIsInterviewLimitBypassed(Boolean(data?.isPremiumUser));
      } catch {}
    };

    loadQuota();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStart = async () => {
    if (!isInterviewLimitBypassed && interviewsRemaining <= 0) {
      toast.error(
        `Interview limit reached. You can only create ${maxInterviewsAllowed} interviews per account.`,
      );
      return;
    }

    if (!resumeFile || !jobDescription.trim()) {
      toast.warning("Please upload resume and paste job description.");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jd", jobDescription);
      formData.append("type", selectedType);
      formData.append("difficulty", difficulty);

      const response = await apiFetch("/api/interview/start", {
        method: "POST",
        headers: {},
        body: formData,
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        if (
          response.status === 403 &&
          data?.code === "INTERVIEW_LIMIT_REACHED"
        ) {
          setIsInterviewLimitBypassed(false);
          setInterviewsRemaining(0);
        }
        toast.error(data?.message || "Failed to start interview.");
        return;
      }

      if (!data?.sessionId) {
        toast.error(
          "Interview started but session id is missing. Please retry.",
        );
        return;
      }

      navigate(`/live/${data.sessionId}`);
    } catch (error) {
      console.error("Error starting interview:", error);
      toast.error(
        "Unable to start interview right now. Please check backend and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Setup Your Interview
        </h1>
        <p className="text-gray-600 mt-1">
          Configure the parameters for your AI mock interview.
        </p>
        {isInterviewLimitBypassed ? (
          <p className="text-sm text-emerald-600 mt-2">
            Testing mode enabled for this account: interview limit is bypassed.
          </p>
        ) : (
          <p className="text-sm text-gray-600 mt-2">
            Interviews used: {interviewsUsed}/{maxInterviewsAllowed} ·
            Remaining: {interviewsRemaining}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Resume upload card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              1. Upload Resume
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
              <label
                htmlFor="resumeUpload"
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer block"
              >
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="text-sm font-medium text-blue-600 mb-1">
                  Click to upload or drag and drop
                </div>
                <p className="text-xs text-gray-500">PDF, DOCX up to 5MB</p>
              </label>

              <input
                type="file"
                id="resumeUpload"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => setResumeFile(e.target.files[0])}
              />
            </div>
            {resumeFile && (
              <div className="mt-4 flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                <FileText className="w-5 h-5 mr-3 shrink-0" />
                <span className="text-sm font-medium truncate">
                  {resumeFile.name}
                </span>
              </div>
            )}
          </div>

          {/* Job description textarea */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              2. Job Description
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Paste the job description to tailor the questions.
            </p>
            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="e.g. We are looking for a Senior Frontend Engineer..."
            />
          </div>
        </div>

        <div className="space-y-8">
          {/* Interview type selection cards */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              3. Interview Type
            </h2>
            <div className="space-y-3">
              {interviewTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-colors flex items-start ${
                    selectedType === type.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg mr-4 ${selectedType === type.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                  >
                    <type.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div
                      className={`font-medium ${selectedType === type.id ? "text-blue-900" : "text-gray-900"}`}
                    >
                      {type.label}
                    </div>
                    <div
                      className={`text-sm mt-1 ${selectedType === type.id ? "text-blue-700" : "text-gray-500"}`}
                    >
                      {type.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty selection */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              4. Difficulty Level
            </h2>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {["easy", "medium", "hard"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg capitalize transition-colors ${
                    difficulty === level
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Primary action button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button
          onClick={handleStart}
          disabled={
            isSubmitting ||
            (!isInterviewLimitBypassed && interviewsRemaining <= 0)
          }
          className="px-8 py-3 text-lg"
        >
          {isSubmitting
            ? "Starting..."
            : !isInterviewLimitBypassed && interviewsRemaining <= 0
              ? "Interview Limit Reached"
              : "Start Interview Now"}
        </Button>
      </div>
    </div>
  );
}
