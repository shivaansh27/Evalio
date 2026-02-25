import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  CheckCircle,
  TrendingUp,
  Award,
  Calendar,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import { apiFetch } from "../lib/api";
import { DashboardSkeleton } from "../components/Skeleton";

const INTERVIEW_TIPS = [
  "Answer with a clear structure: start with context, explain your action, and finish with measurable results.",
  "Pause for one second before speaking to reduce filler words and sound more confident.",
  "Keep answers concise first, then add depth when the interviewer asks follow-up questions.",
  "For technical questions, state tradeoffs instead of jumping straight to one solution.",
  "Use one concrete project example for each strength you claim to make your answers more credible.",
  "When unsure, explain your thought process step by step instead of staying silent.",
  "Use the STAR format for behavioral questions and include specific impact numbers when possible.",
  "At the end of a response, quickly summarize your final point to improve clarity.",
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    averageScore: 0,
    interviewsCompleted: 0,
    recentSessions: [],
    latestCompletedSessionId: null,
  });

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.displayName ||
    user?.username ||
    (user?.email ? user.email.split("@")[0] : "User");

  const loadDashboardSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/interview/dashboard/summary");
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load dashboard metrics.");
      }

      setSummary({
        averageScore: Number.isFinite(Number(data?.averageScore))
          ? Number(data.averageScore)
          : 0,
        interviewsCompleted: Number.isFinite(Number(data?.interviewsCompleted))
          ? Number(data.interviewsCompleted)
          : 0,
        recentSessions: Array.isArray(data?.recentSessions)
          ? data.recentSessions
          : [],
        latestCompletedSessionId: data?.latestCompletedSessionId || null,
      });
    } catch (err) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardSummary();
  }, [loadDashboardSummary]);

  const latestReportPath = useMemo(
    () =>
      summary.latestCompletedSessionId
        ? `/report/${summary.latestCompletedSessionId}`
        : "/history",
    [summary.latestCompletedSessionId],
  );

  const recentSessions = useMemo(
    () =>
      summary.recentSessions.map((session) => {
        const formatWord = (value = "") =>
          value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

        return {
          ...session,
          title: `${formatWord(session.interviewType)} • ${formatWord(session.difficulty)}`,
          dateLabel: new Date(session.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };
      }),
    [summary.recentSessions],
  );

  const randomTip = useMemo(() => {
    const index = Math.floor(Math.random() * INTERVIEW_TIPS.length);
    return INTERVIEW_TIPS[index];
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {displayName}
        </h1>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={loadDashboardSummary}
              className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
            <Play className="w-6 h-6 text-indigo-600 ml-1" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Start New Interview
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Upload a JD and resume to begin a tailored AI mock session.
          </p>
          <Link
            to="/setup"
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Configure Session <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Review Feedback
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {summary.latestCompletedSessionId
              ? "Your latest report is ready."
              : "No completed reports yet. Complete an interview to see feedback."}
          </p>
          <Link
            to={latestReportPath}
            className="inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700"
          >
            {summary.latestCompletedSessionId ? "View Report" : "View History"}{" "}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Skill Analytics
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Track your progress and identify areas for improvement over time.
          </p>
          <Link
            to="/analytics"
            className="inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            View Analytics <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Performance Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Average Score
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {loading ? "--" : `${summary.averageScore}%`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Interviews Completed
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {loading ? "--" : summary.interviewsCompleted}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      Total
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Sessions
              </h2>
              <Link
                to="/history"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                View All
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-3">
                  <div className="h-12 rounded-lg bg-gray-100 animate-pulse" />
                  <div className="h-12 rounded-lg bg-gray-100 animate-pulse" />
                  <div className="h-12 rounded-lg bg-gray-100 animate-pulse" />
                </div>
              ) : recentSessions.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    No completed interviews yet.
                  </p>
                  <Link
                    to="/setup"
                    className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Start Your First Interview{" "}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {recentSessions.map((session) => (
                    <li key={session.sessionId}>
                      <Link
                        to={`/report/${session.sessionId}`}
                        className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate">
                            {session.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />{" "}
                              {session.dateLabel}
                            </span>
                            <span>
                              {session.answeredCount}/{session.totalQuestions}{" "}
                              answered
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald-600">
                            {session.overallScore}% Score
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">
              Pro Tip
            </h3>
            <p className="text-sm text-indigo-800 mb-4 leading-relaxed">
              {randomTip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
