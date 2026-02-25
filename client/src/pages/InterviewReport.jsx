import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useToast } from "../context/ToastContext";
import {
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Target,
  MessageSquare,
  Zap,
  BarChart3,
  ArrowLeft,
  Download,
} from "lucide-react";

const getScoreColor = (score) => {
  if (score >= 70)
    return {
      bg: "bg-emerald-500",
      stroke: "#10b981",
      text: "text-emerald-600",
      border: "border-emerald-200",
      light: "bg-emerald-50",
      ring: "ring-emerald-500",
    };
  if (score >= 50)
    return {
      bg: "bg-amber-500",
      stroke: "#f59e0b",
      text: "text-amber-600",
      border: "border-amber-200",
      light: "bg-amber-50",
      ring: "ring-amber-500",
    };
  return {
    bg: "bg-red-500",
    stroke: "#ef4444",
    text: "text-red-600",
    border: "border-red-200",
    light: "bg-red-50",
    ring: "ring-red-500",
  };
};

const CircularScore = ({ score, size = 160 }) => {
  const colors = getScoreColor(score);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(100, Math.max(0, score || 0));
  const strokeDashoffset =
    circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${colors.text}`}>
          {score ?? 0}
        </span>
        <span className="text-sm text-gray-500">out of 100</span>
      </div>
    </div>
  );
};

const SkillBar = ({ label, score, icon: Icon }) => {
  const colors = getScoreColor(score);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className={`text-sm font-bold ${colors.text}`}>
          {score ?? 0}%
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${colors.bg} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, score || 0))}%` }}
        />
      </div>
    </div>
  );
};

const QuestionAccordion = ({ answer, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const score = answer?.scores?.overall ?? 0;
  const colors = getScoreColor(score);

  return (
    <div
      className={`rounded-xl border ${colors.border} ${colors.light} overflow-hidden transition-all duration-200`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center justify-center h-8 w-8 rounded-full ${colors.bg} text-white text-sm font-bold`}
          >
            {index + 1}
          </span>
          <div>
            <p className="font-medium text-gray-900 line-clamp-1">
              {answer.questionText || `Question ${index + 1}`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Score:{" "}
              <span className={`font-semibold ${colors.text}`}>{score}%</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block w-24">
            <div className="h-2 w-full rounded-full bg-white/80 overflow-hidden">
              <div
                className={`h-full rounded-full ${colors.bg}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      <div
        className={`accordion-content px-4 pb-4 space-y-4 border-t border-gray-200/50 bg-white/60 ${isOpen ? "" : "hidden"}`}
      >
        <div className="pt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Question
          </h4>
          <p className="text-sm text-gray-800">
            {answer.questionText || "Question not available"}
          </p>
        </div>

        {answer.transcript && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Your Response
            </h4>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
              {answer.transcript}
            </p>
          </div>
        )}

        {answer.feedback && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              AI Feedback
            </h4>
            <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 border border-blue-100">
              {answer.feedback}
            </p>
          </div>
        )}

        {answer.scores && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Score Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(answer.scores)
                .filter(([key]) => key !== "overall")
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100"
                  >
                    <span className="text-xs text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span
                      className={`text-xs font-bold ${getScoreColor(value).text}`}
                    >
                      {value}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function InterviewReport() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  const handleExportPDF = () => {
    toast.info("Opening print dialog...");
    const style = document.createElement("style");
    style.id = "print-styles";
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #print-area, #print-area * { visibility: visible; }
        #print-area { 
          position: absolute; 
          left: 0; 
          top: 0; 
          width: 100%;
          padding: 20px;
        }
        button, .no-print { display: none !important; }
        
        /* Force show all accordion content - override hidden class */
        .accordion-content { display: block !important; }
        .accordion-content.hidden { display: block !important; }
        
        /* Ensure proper spacing */
        .space-y-8 > * + * { margin-top: 24px; }
        .space-y-3 > * + * { margin-top: 12px; }
        .space-y-4 > * + * { margin-top: 16px; }
        
        @page { margin: 15mm; }
      }
    `;
    document.head.appendChild(style);

    window.print();

    setTimeout(() => {
      const printStyle = document.getElementById("print-styles");
      if (printStyle) printStyle.remove();
    }, 1000);
  };

  useEffect(() => {
    let active = true;

    const loadReport = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiFetch(`/api/interview/${sessionId}/report`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to load report");
        }
        if (active) setReport(data);
      } catch (err) {
        if (active) setError(err.message || "Failed to load report");
      } finally {
        if (active) setLoading(false);
      }
    };

    if (sessionId) loadReport();
    else {
      setError("Missing session id");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [sessionId]);

  const generateCoachingSummary = () => {
    const strongPoints = report?.strongPoints || [];
    const weakPoints = report?.weakPoints || [];
    const score = report?.overallScore ?? 0;

    let summary = "";

    if (score >= 70) {
      summary = "Excellent performance! ";
    } else if (score >= 50) {
      summary = "Good effort with room for improvement. ";
    } else {
      summary = "This interview highlighted several areas for growth. ";
    }

    if (strongPoints.length > 0) {
      summary += `You demonstrated strength in ${strongPoints.slice(0, 2).join(" and ").toLowerCase()}. `;
    }

    if (weakPoints.length > 0) {
      summary += `Focus on improving ${weakPoints.slice(0, 2).join(" and ").toLowerCase()} for better results.`;
    }

    return (
      summary ||
      "Complete more questions to receive detailed coaching feedback."
    );
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 bg-gray-100 rounded-2xl" />
            <div className="h-48 bg-gray-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Unable to Load Report
          </h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const overallScore = report?.overallScore ?? 0;
  const scoreColors = getScoreColor(overallScore);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <button
          type="button"
          onClick={handleExportPDF}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      <div id="print-area" className="space-y-8">
        <div
          className={`rounded-2xl border-2 ${scoreColors.border} ${scoreColors.light} p-8 shadow-sm`}
        >
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <CircularScore score={overallScore} size={180} />
            </div>

            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${scoreColors.light} ${scoreColors.text} border ${scoreColors.border}`}
                >
                  {report?.interviewType?.toUpperCase() || "INTERVIEW"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                  {report?.difficulty?.toUpperCase() || "MEDIUM"}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Interview Performance Report
              </h1>

              <p className="text-gray-600 leading-relaxed max-w-xl">
                {generateCoachingSummary()}
              </p>

              <div className="flex items-center justify-center lg:justify-start gap-6 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {report?.answeredCount ?? 0}/{report?.totalQuestions ?? 0}
                  </p>
                  <p className="text-xs text-gray-500">Questions Answered</p>
                </div>
                <div className="h-10 w-px bg-gray-200" />
                <div className="text-center">
                  <p className={`text-2xl font-bold ${scoreColors.text}`}>
                    {overallScore}%
                  </p>
                  <p className="text-xs text-gray-500">Overall Score</p>
                </div>
                <div className="h-10 w-px bg-gray-200" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {report?.scores?.speechFlowScore ?? 0}%
                  </p>
                  <p className="text-xs text-gray-500">Speech Flow</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">
              Skill Assessment
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkillBar
              label="Relevance"
              score={report?.scores?.relevance ?? 0}
              icon={Target}
            />
            <SkillBar
              label="Technical Depth"
              score={report?.scores?.technicalDepth ?? 0}
              icon={Zap}
            />
            <SkillBar
              label="Clarity"
              score={report?.scores?.clarity ?? 0}
              icon={MessageSquare}
            />
            <SkillBar
              label="Fluency"
              score={report?.scores?.fluency ?? 0}
              icon={TrendingUp}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-700">
                  What You Did Well
                </h3>
                <p className="text-xs text-emerald-600">
                  Keep building on these strengths
                </p>
              </div>
            </div>
            <ul className="space-y-3">
              {(report?.strongPoints || []).length > 0 ? (
                report.strongPoints.map((point, idx) => (
                  <li key={`strong-${idx}`} className="flex items-start gap-3">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    </span>
                    <span className="text-sm text-gray-700">{point}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 italic">
                  Complete the interview to see your strengths
                </li>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border-2 border-amber-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-700">
                  Areas to Improve
                </h3>
                <p className="text-xs text-amber-600">
                  Focus on these for better results
                </p>
              </div>
            </div>
            <ul className="space-y-3">
              {(report?.weakPoints || []).length > 0 ? (
                report.weakPoints.map((point, idx) => (
                  <li key={`weak-${idx}`} className="flex items-start gap-3">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                    </span>
                    <span className="text-sm text-gray-700">{point}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500 italic">
                  Complete the interview to see areas for improvement
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                Question Breakdown
              </h2>
            </div>
            <span className="text-sm text-gray-500">
              {report?.answers?.length || 0} questions reviewed
            </span>
          </div>

          <div className="space-y-3">
            {(report?.answers || []).length > 0 ? (
              report.answers.map((answer, index) => (
                <QuestionAccordion
                  key={answer.questionId || index}
                  answer={answer}
                  index={index}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No questions answered yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => navigate("/setup")}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          Start New Interview
        </button>
        <button
          type="button"
          onClick={() => navigate("/history")}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          View History
        </button>
      </div>
    </div>
  );
}
