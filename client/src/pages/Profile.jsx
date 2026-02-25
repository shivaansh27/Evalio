import { useEffect, useMemo, useState } from "react";
import { Mail, User, Lock, Eye, EyeOff } from "lucide-react";
import Button from "../components/Button";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/authContext";
import { ProfileSkeleton } from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import PageTransition from "../components/PageTransition";

export default function Profile() {
  const { user: authUser, token, login } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  // Validation states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Email validation
  const validateEmail = (email) => {
    if (!email?.trim()) {
      return "Email is required";
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return "Invalid email format";
    }
    return "";
  };

  // Password validation
  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Minimum 8 characters required";
    }
    if (!/[A-Z]/.test(password)) {
      return "Add at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Add at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Add at least one number";
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return "Add at least one special character (!@#$%^&*)";
    }
    return "";
  };

  // Password strength calculator
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  const isGoogleOnly = Boolean(profile?.googleId) && !profile?.hasPassword;

  const initials = useMemo(() => {
    const name = profile?.name || authUser?.name || "U";
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join("");
  }, [authUser?.name, profile?.name]);

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/auth/me");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load profile.");
      }

      setProfile(data);
      setProfileForm({ name: data.name || "", email: data.email || "" });
    } catch (err) {
      setError(err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage("");
    setError("");

    // Validate email before saving
    const emailValidationError = validateEmail(profileForm.email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setProfileSaving(false);
      return;
    }

    try {
      const response = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(profileForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }

      setProfile(data.user);
      toast.success(data.message || "Profile updated successfully!");

      if (token) {
        login(
          {
            ...(authUser || {}),
            ...data.user,
          },
          token,
        );
      }
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage("");
    setError("");

    // Validate new password before saving
    const passwordValidationError = validatePassword(passwordForm.newPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      setPasswordSaving(false);
      return;
    }

    try {
      const response = await apiFetch("/api/auth/me/password", {
        method: "PATCH",
        body: JSON.stringify(passwordForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update password.");
      }

      toast.success(data.message || "Password updated successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your profile information and account security.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover-glow">
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {initials || "U"}
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {profile?.name}
              </h2>
              <p className="text-gray-500">{profile?.email}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <form onSubmit={handleProfileSave} className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => {
                      const value = e.target.value;
                      setProfileForm((prev) => ({ ...prev, email: value }));
                      if (emailError) {
                        setEmailError(validateEmail(value));
                      }
                    }}
                    onBlur={() =>
                      setEmailError(validateEmail(profileForm.email))
                    }
                    className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      emailError
                        ? "border-red-500"
                        : profileForm.email && !emailError
                          ? "border-green-500"
                          : "border-gray-300"
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="text-red-500 text-xs mt-1">{emailError}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-600">{profileMessage}</span>
              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>

          <div className="w-full h-px bg-gray-200"></div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Security</h3>

            {isGoogleOnly ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                You&apos;re signed in with Google. Password is managed by
                Google.
              </div>
            ) : (
              <form onSubmit={handlePasswordSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPasswordForm((prev) => ({
                            ...prev,
                            newPassword: value,
                          }));
                          if (passwordError) {
                            setPasswordError(validatePassword(value));
                          }
                        }}
                        onBlur={() => {
                          if (passwordForm.newPassword) {
                            setPasswordError(
                              validatePassword(passwordForm.newPassword),
                            );
                          }
                        }}
                        className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          passwordError
                            ? "border-red-500"
                            : passwordForm.newPassword && !passwordError
                              ? "border-green-500"
                              : "border-gray-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {passwordForm.newPassword && (
                      <div className="mt-2">
                        <div className="h-2 rounded bg-gray-200 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordStrength <= 2
                                ? "bg-red-500 w-1/4"
                                : passwordStrength === 3
                                  ? "bg-yellow-500 w-2/4"
                                  : passwordStrength === 4
                                    ? "bg-blue-500 w-3/4"
                                    : passwordStrength === 5
                                      ? "bg-green-500 w-full"
                                      : "w-0"
                            }`}
                          />
                        </div>
                        <p className="text-xs mt-1 text-gray-500">
                          Strength:{" "}
                          {passwordStrength <= 2
                            ? "Weak"
                            : passwordStrength === 3
                              ? "Moderate"
                              : passwordStrength === 4
                                ? "Strong"
                                : "Very Strong"}
                        </p>
                      </div>
                    )}
                    {passwordError && (
                      <p className="text-red-500 text-xs mt-1">
                        {passwordError}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">
                    {passwordMessage}
                  </span>
                  <Button type="submit" disabled={passwordSaving}>
                    {passwordSaving ? "Updating..." : "Change Password"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
