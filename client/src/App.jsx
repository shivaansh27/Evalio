import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";
import DashboardOverview from "./pages/DashboardOverview";
import ProtectedRoute from "./components/protectedRoute";
import { useAuth } from "./context/authContext";
import SetupInterview from "./pages/SetupInterview";
import InterviewHistory from "./pages/InterviewHistory";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import LiveInterview from "./pages/LiveInterview";
import InterviewReport from "./pages/InterviewReport";
import NotFound from "./pages/NotFound";

export default function App() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-600">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/signup"
        element={token ? <Navigate to="/dashboard" replace /> : <SignUp />}
      />
      <Route
        path="/signin"
        element={token ? <Navigate to="/dashboard" replace /> : <SignIn />}
      />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardOverview />} />
        <Route path="/setup" element={<SetupInterview />} />
        <Route path="/history" element={<InterviewHistory />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Profile />} />
        <Route path="/live/:sessionId" element={<LiveInterview />} />
        <Route path="/report/:sessionId" element={<InterviewReport />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
