import { Link } from "react-router-dom";
import { FileText, BarChart3, Calendar, Users } from "lucide-react";

const illustrations = {
  interviews: (
    <svg
      className="w-40 h-40 text-gray-300"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="80" fill="currentColor" opacity="0.1" />
      <rect
        x="60"
        y="90"
        width="80"
        height="50"
        rx="4"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="70"
        y="100"
        width="25"
        height="15"
        rx="2"
        fill="currentColor"
        opacity="0.5"
      />
      <rect
        x="100"
        y="100"
        width="30"
        height="3"
        rx="1"
        fill="currentColor"
        opacity="0.4"
      />
      <rect
        x="100"
        y="108"
        width="25"
        height="3"
        rx="1"
        fill="currentColor"
        opacity="0.4"
      />
      <circle cx="82" cy="70" r="15" fill="currentColor" opacity="0.4" />
      <path
        d="M67 90 Q82 85 97 90"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  ),
  analytics: (
    <svg
      className="w-40 h-40 text-gray-300"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="80" fill="currentColor" opacity="0.1" />
      <rect
        x="50"
        y="120"
        width="20"
        height="40"
        rx="2"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="80"
        y="100"
        width="20"
        height="60"
        rx="2"
        fill="currentColor"
        opacity="0.4"
      />
      <rect
        x="110"
        y="80"
        width="20"
        height="80"
        rx="2"
        fill="currentColor"
        opacity="0.5"
      />
      <rect
        x="140"
        y="60"
        width="20"
        height="100"
        rx="2"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M50 55 L80 75 L110 50 L150 65"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="50" cy="55" r="4" fill="currentColor" opacity="0.6" />
      <circle cx="80" cy="75" r="4" fill="currentColor" opacity="0.6" />
      <circle cx="110" cy="50" r="4" fill="currentColor" opacity="0.6" />
      <circle cx="150" cy="65" r="4" fill="currentColor" opacity="0.6" />
    </svg>
  ),
  search: (
    <svg
      className="w-40 h-40 text-gray-300"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="80" fill="currentColor" opacity="0.1" />
      <circle
        cx="90"
        cy="90"
        r="35"
        stroke="currentColor"
        strokeWidth="8"
        opacity="0.4"
        fill="none"
      />
      <line
        x1="115"
        y1="115"
        x2="145"
        y2="145"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.4"
      />
      <line
        x1="75"
        y1="90"
        x2="105"
        y2="90"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  ),
  default: (
    <svg
      className="w-40 h-40 text-gray-300"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="80" fill="currentColor" opacity="0.1" />
      <rect
        x="65"
        y="60"
        width="70"
        height="80"
        rx="4"
        fill="currentColor"
        opacity="0.2"
      />
      <rect
        x="75"
        y="75"
        width="50"
        height="4"
        rx="2"
        fill="currentColor"
        opacity="0.4"
      />
      <rect
        x="75"
        y="85"
        width="40"
        height="4"
        rx="2"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="75"
        y="95"
        width="45"
        height="4"
        rx="2"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="75"
        y="115"
        width="30"
        height="8"
        rx="2"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  ),
};

const icons = {
  interviews: FileText,
  analytics: BarChart3,
  calendar: Calendar,
  users: Users,
};

export default function EmptyState({
  type = "default",
  title = "No data found",
  description = "There's nothing here yet.",
  actionLabel,
  actionLink,
  onAction,
}) {
  const Icon = icons[type] || FileText;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {illustrations[type] || illustrations.default}

      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 text-center max-w-sm">
        {description}
      </p>

      {(actionLabel && actionLink) || onAction ? (
        <div className="mt-6">
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Icon className="w-4 h-4" />
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Icon className="w-4 h-4" />
              {actionLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
