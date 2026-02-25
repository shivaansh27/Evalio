import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Mic,
  History,
  LineChart,
  Brain,
  FileText,
  Settings,
  Menu,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../context/authContext";
const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.displayName ||
    user?.username ||
    (user?.email ? user.email.split("@")[0] : "User");

  const userInitials = displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate("/signin", { replace: true });
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Start Interview", path: "/setup", icon: Mic },
    { name: "History", path: "/history", icon: History },
    { name: "Analytics", path: "/analytics", icon: LineChart },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      <aside className="w-64 border-r border-gray-200 bg-white flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-2">
          <Brain className="w-7 h-7 text-primary" />
          <span className="font-bold text-xl mx-1 tracking-tight">Evalio</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md group transition-colors",
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 mr-3",
                    isActive
                      ? "text-gray-500 group-hover:text-gray-900"
                      : "text-gray-400 group-hover:text-gray-500",
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white ring-2 ring-white">
              {userInitials}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {displayName}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-4 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <LogOut className="h-3 w-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-10">
        <div className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Brain className="text-zinc-900 text-3xl w-8 h-8" />
            <span className="font-bold text-xl">Evalio</span>
          </div>
          <button
            className="p-2 rounded-md text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mb-6 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
            <nav className="py-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 mr-3",
                        isActive ? "text-gray-500" : "text-gray-400",
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                    {userInitials}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {displayName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        <Outlet />
      </main>
    </div>
  );
}
