import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../lib/api";
import { AnalyticsSkeleton } from "../components/Skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertCircle,
  BarChart3,
  Activity,
  Zap,
  MessageSquare,
  Mic,
} from "lucide-react";

// Score color utility
const getScoreColor = (score) => {
  if (score >= 70) return { text: "text-emerald-600", bg: "bg-emerald-500" };
  if (score >= 50) return { text: "text-amber-600", bg: "bg-amber-500" };
  return { text: "text-red-600", bg: "bg-red-500" };
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "indigo",
}) => {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(trend)}% vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}:{" "}
            {typeof entry.value === "number"
              ? entry.value.toFixed(1)
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiFetch("/api/interview/history");
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load analytics data.");
        }

        if (active) {
          setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load analytics data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const analytics = useMemo(() => {
    if (!sessions.length) return null;

    const completedSessions = sessions.filter(
      (s) => s.status?.toLowerCase() === "completed" && s.answers?.length > 0,
    );

    if (!completedSessions.length) return null;

    const progressData = completedSessions.slice(-10).map((session, index) => {
      const avgScore =
        session.answers.reduce((sum, a) => sum + (a.scores?.overall || 0), 0) /
        session.answers.length;
      return {
        name: `#${index + 1}`,
        date: new Date(session.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: Math.round(avgScore),
        type: session.interviewType,
      };
    });

    const skillTotals = {
      relevance: 0,
      technicalDepth: 0,
      clarity: 0,
      fluency: 0,
      speechFlow: 0,
    };
    let answerCount = 0;

    completedSessions.forEach((session) => {
      session.answers.forEach((answer) => {
        if (answer.scores) {
          skillTotals.relevance += answer.scores.relevance || 0;
          skillTotals.technicalDepth += answer.scores.technicalDepth || 0;
          skillTotals.clarity += answer.scores.clarity || 0;
          skillTotals.fluency += answer.scores.fluency || 0;
          skillTotals.speechFlow += answer.scores.speechFlowScore || 0;
          answerCount++;
        }
      });
    });

    const radarData =
      answerCount > 0
        ? [
            {
              skill: "Relevance",
              score: Math.round(skillTotals.relevance / answerCount),
              fullMark: 100,
            },
            {
              skill: "Technical",
              score: Math.round(skillTotals.technicalDepth / answerCount),
              fullMark: 100,
            },
            {
              skill: "Clarity",
              score: Math.round(skillTotals.clarity / answerCount),
              fullMark: 100,
            },
            {
              skill: "Fluency",
              score: Math.round(skillTotals.fluency / answerCount),
              fullMark: 100,
            },
            {
              skill: "Speech Flow",
              score: Math.round(skillTotals.speechFlow / answerCount),
              fullMark: 100,
            },
          ]
        : [];

    const categoryScores = { technical: [], behavioral: [], case: [] };
    completedSessions.forEach((session) => {
      const avgScore =
        session.answers.reduce((sum, a) => sum + (a.scores?.overall || 0), 0) /
        session.answers.length;
      if (categoryScores[session.interviewType]) {
        categoryScores[session.interviewType].push(avgScore);
      }
    });

    const categoryData = Object.entries(categoryScores)
      .filter(([, scores]) => scores.length > 0)
      .map(([category, scores]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        sessions: scores.length,
      }));

    const sortedSkills = radarData.sort((a, b) => b.score - a.score);
    const strongestSkill = sortedSkills[0];
    const weakestSkill = sortedSkills[sortedSkills.length - 1];

    const totalInterviews = completedSessions.length;
    const totalQuestions = completedSessions.reduce(
      (sum, s) => sum + s.answers.length,
      0,
    );
    const overallAvg = Math.round(
      completedSessions.reduce((sum, s) => {
        const sessionAvg =
          s.answers.reduce((a, b) => a + (b.scores?.overall || 0), 0) /
          s.answers.length;
        return sum + sessionAvg;
      }, 0) / completedSessions.length,
    );

    let trend = 0;
    if (completedSessions.length >= 4) {
      const recent = completedSessions.slice(-3);
      const previous = completedSessions.slice(-6, -3);
      if (previous.length > 0) {
        const recentAvg =
          recent.reduce((sum, s) => {
            return (
              sum +
              s.answers.reduce((a, b) => a + (b.scores?.overall || 0), 0) /
                s.answers.length
            );
          }, 0) / recent.length;
        const previousAvg =
          previous.reduce((sum, s) => {
            return (
              sum +
              s.answers.reduce((a, b) => a + (b.scores?.overall || 0), 0) /
                s.answers.length
            );
          }, 0) / previous.length;
        trend = Math.round(((recentAvg - previousAvg) / previousAvg) * 100);
      }
    }

    return {
      progressData,
      radarData: radarData.sort((a, b) => a.skill.localeCompare(b.skill)),
      categoryData,
      strongestSkill,
      weakestSkill,
      totalInterviews,
      totalQuestions,
      overallAvg,
      trend,
    };
  }, [sessions]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">
            Failed to load analytics
          </p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skill Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track your progress and identify areas for improvement.
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Data Yet
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Complete at least one interview session to see your performance
            analytics and skill trends.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Skill Analytics</h1>
        <p className="text-gray-600 mt-1">
          Track your progress and identify areas for improvement over time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Interviews"
          value={analytics.totalInterviews}
          subtitle="Completed sessions"
          icon={Target}
          color="indigo"
        />
        <StatCard
          title="Questions Answered"
          value={analytics.totalQuestions}
          subtitle="Across all sessions"
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          title="Average Score"
          value={`${analytics.overallAvg}%`}
          subtitle="Overall performance"
          icon={Award}
          trend={analytics.trend}
          color={
            analytics.overallAvg >= 70
              ? "emerald"
              : analytics.overallAvg >= 50
                ? "amber"
                : "red"
          }
        />
        <StatCard
          title="Best Category"
          value={analytics.categoryData[0]?.category || "N/A"}
          subtitle={`${analytics.categoryData[0]?.avgScore || 0}% average`}
          icon={Zap}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Skill Radar
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={analytics.radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: "#9ca3af", fontSize: 10 }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Progress Over Time
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.progressData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#colorScore)"
                  dot={{ fill: "#6366f1", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#4f46e5" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Performance by Category
          </h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="avgScore"
                  name="Avg Score"
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-emerald-500">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Strongest Area
                </h3>
                <div className="text-xl font-bold text-gray-900">
                  {analytics.strongestSkill?.skill || "N/A"}
                </div>
                <div className="mt-2 text-sm text-emerald-600 font-medium">
                  {analytics.strongestSkill?.score || 0}% average score
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Keep leveraging this strength in your interviews!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-amber-500">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <Target className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Focus Area
                </h3>
                <div className="text-xl font-bold text-gray-900">
                  {analytics.weakestSkill?.skill || "N/A"}
                </div>
                <div className="mt-2 text-sm text-amber-600 font-medium">
                  {analytics.weakestSkill?.score || 0}% average score
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Practice more to improve this skill area.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                Practice at least 3 interviews per week for best results
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                Focus on your weakest skill area in your next session
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                Review feedback from previous interviews before practicing
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
