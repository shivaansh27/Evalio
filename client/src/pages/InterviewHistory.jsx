import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Trash2,
  AlertTriangle,
  X,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import Button from "../components/Button";
import { HistoryTableSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import { apiFetch } from "../lib/api";
import { useToast } from "../context/ToastContext";

const capitalize = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

const formatLabel = (type, difficulty) =>
  `${capitalize(type)} • ${capitalize(difficulty)}`;

function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  sessionLabel,
  isDeleting,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={isDeleting}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Interview Session
            </h3>
            <p className="text-sm text-gray-500">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete the{" "}
          <span className="font-medium">{sessionLabel}</span> interview session?
          All associated data including answers and recordings will be
          permanently removed.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InterviewHistory() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sessions, setSessions] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    session: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiFetch("/api/interview/history");
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load interview history.");
        }

        if (active) {
          setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load interview history.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      active = false;
    };
  }, []);

  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((session) => {
        const interviewType = String(
          session?.interviewType || "",
        ).toLowerCase();
        const difficulty = String(session?.difficulty || "").toLowerCase();
        const sessionId = String(session?.sessionId || "").toLowerCase();
        return (
          interviewType.includes(query) ||
          difficulty.includes(query) ||
          sessionId.includes(query)
        );
      });
    }

    if (filterStatus !== "all") {
      result = result.filter((session) => {
        const answeredCount = Number(session?.answeredCount || 0);
        const totalQuestions = Number(session?.totalQuestions || 0);
        const isInProgress = answeredCount < totalQuestions;

        if (filterStatus === "completed") return !isInProgress;
        if (filterStatus === "in-progress") return isInProgress;
        return true;
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "date-asc":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "score-desc":
          return Number(b.overallScore || 0) - Number(a.overallScore || 0);
        case "score-asc":
          return Number(a.overallScore || 0) - Number(b.overallScore || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [search, sessions, filterStatus, sortBy]);

  const retryLoad = () => {
    setLoading(true);
    setError("");
    setSessions([]);
    setSearch("");
    (async () => {
      try {
        const response = await apiFetch("/api/interview/history");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || "Failed to load interview history.");
        }
        setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      } catch (err) {
        setError(err.message || "Failed to load interview history.");
      } finally {
        setLoading(false);
      }
    })();
  };

  const openDeleteModal = (session) => {
    setDeleteModal({ isOpen: true, session });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, session: null });
  };

  const handleDelete = async () => {
    if (!deleteModal.session) return;

    setIsDeleting(true);
    try {
      const response = await apiFetch(
        `/api/interview/${deleteModal.session.sessionId}`,
        {
          method: "DELETE",
        },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete interview session.");
      }

      setSessions((prev) =>
        prev.filter((s) => s.sessionId !== deleteModal.session.sessionId),
      );
      toast.success("Interview session deleted successfully.");
      closeDeleteModal();
    } catch (err) {
      toast.error(err.message || "Failed to delete interview session.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        sessionLabel={
          deleteModal.session
            ? formatLabel(
                deleteModal.session.interviewType,
                deleteModal.session.difficulty,
              )
            : ""
        }
        isDeleting={isDeleting}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Interview History
          </h1>
          <p className="text-gray-600 mt-1">
            Review your past practice sessions and feedback.
          </p>
        </div>
        <Link to="/setup">
          <Button>New Interview</Button>
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={retryLoad}
            className="rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by type, difficulty, or session id..."
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ArrowUpDown className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="score-desc">Highest Score</option>
                <option value="score-asc">Lowest Score</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <HistoryTableSkeleton rows={5} />
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      type={
                        search || filterStatus !== "all"
                          ? "search"
                          : "interviews"
                      }
                      title={
                        search || filterStatus !== "all"
                          ? "No matching sessions"
                          : "No interview sessions yet"
                      }
                      description={
                        search || filterStatus !== "all"
                          ? "Try adjusting your search or filters to find what you're looking for."
                          : "Start your first mock interview to begin building your history and tracking your progress."
                      }
                      actionLabel={
                        search || filterStatus !== "all"
                          ? "Clear Filters"
                          : "Start Interview"
                      }
                      actionLink={
                        search || filterStatus !== "all" ? undefined : "/setup"
                      }
                      onAction={
                        search || filterStatus !== "all"
                          ? () => {
                              setSearch("");
                              setFilterStatus("all");
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => {
                  const score = Number(session?.overallScore || 0);
                  const scoreClass =
                    score >= 80
                      ? "text-green-600"
                      : score >= 60
                        ? "text-yellow-600"
                        : "text-red-600";
                  const createdAt = session?.createdAt
                    ? new Date(session.createdAt).toLocaleString()
                    : "-";
                  const answeredCount = Number(session?.answeredCount || 0);
                  const totalQuestions = Number(session?.totalQuestions || 0);
                  const isInProgress = answeredCount < totalQuestions;

                  return (
                    <tr
                      key={session.sessionId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatLabel(
                            session.interviewType,
                            session.difficulty,
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Session: {String(session.sessionId).slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{createdAt}</div>
                        <div className="text-sm text-gray-500">
                          {answeredCount}/{totalQuestions} answered
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${scoreClass}`}>
                          {score}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {session.status || "Completed"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          {isInProgress ? (
                            <Link
                              to={`/live/${session.sessionId}`}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              Continue
                            </Link>
                          ) : (
                            <Link
                              to={`/report/${session.sessionId}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => openDeleteModal(session)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                            title="Delete session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <p className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">{filteredSessions.length}</span> of{" "}
            <span className="font-medium">{sessions.length}</span> results
          </p>
        </div>
      </div>
    </div>
  );
}
