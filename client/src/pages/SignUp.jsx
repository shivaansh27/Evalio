import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Sparkles, Eye, EyeOff, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, provider } from "../firebase.js";
import { signInWithPopup } from "firebase/auth";
import { useAuth } from "../context/authContext.jsx";
import { apiFetch } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";
import PageTransition from "../components/PageTransition.jsx";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);

  const getPasswordStrength = () => {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    return strength;
  };

  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      const idToken = await user.getIdToken();

      const res = await apiFetch("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ token: idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Google sign-in failed");
        return;
      }

      login(data.user, data.token);
      navigate("/dashboard");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Google sign-in failed. Please try again.");
    }
  };

  const validateForm = (fieldValues = { name, email, password }) => {
    const newErrors = {};

    if (!fieldValues.name?.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!fieldValues.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(fieldValues.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!fieldValues.password) {
      newErrors.password = "Password is required";
    } else if (fieldValues.password.length < 8) {
      newErrors.password = "Minimum 8 characters required";
    } else if (!/[A-Z]/.test(fieldValues.password)) {
      newErrors.password = "Add at least one uppercase letter";
    } else if (!/[a-z]/.test(fieldValues.password)) {
      newErrors.password = "Add at least one lowercase letter";
    } else if (!/[0-9]/.test(fieldValues.password)) {
      newErrors.password = "Add at least one number";
    } else if (!/[!@#$%^&*]/.test(fieldValues.password)) {
      newErrors.password = "Add at least one special character";
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);

    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();

    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: sanitizedName,
          email: sanitizedEmail,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      login(data.user, data.token);
      navigate("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-grid p-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-400/20 blur-3xl float" />
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/20 blur-3xl float"
            style={{ animationDelay: "2s" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-pink-400/10 to-orange-400/10 blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="flex items-center justify-center gap-2 mb-2"
            >
              <Brain className="w-10 h-10 text-primary" />
              <span className="text-2xl font-bold tracking-tight text-primary">
                Evalio
              </span>
            </motion.div>

            <h1 className="text-2xl font-bold text-slate-900 mt-4 tracking-tight">
              Create your Evalio Account
            </h1>
            <p className="text-slate-500 mt-2">
              The smartest way to master your next interview
            </p>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass rounded-3xl shadow-soft p-8 sm:p-10 hover-glow"
          >
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success-pill text-success-text border border-success-text/10">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-semibold tracking-wide uppercase">
                  AI Smart Interview
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-primary text-white py-3.5 rounded-xl font-medium hover:bg-primary-hover transition-all duration-200 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div className="relative flex items-center justify-center mb-6">
              <div className="flex-grow border-t border-border-light"></div>
              <span className="flex-shrink mx-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
                or email
              </span>
              <div className="flex-grow border-t border-border-light"></div>
            </div>

            <form className="space-y-4" onSubmit={handleSignup}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setName(value);

                    if (errors.name) {
                      setErrors((prev) => ({ ...prev, name: "" }));
                    }

                    validateForm({ name: value, email, password });
                  }}
                  onBlur={() => setTouched({ ...touched, name: true })}
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/5 focus:border-primary transition-all outline-none placeholder:text-slate-400
${name && errors.name ? "border-red-500" : ""}
${name && !errors.name ? "border-green-500" : "border-border-light"}`}
                  placeholder="Rahul Sharma"
                  type="text"
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Work Email
                </label>
                <input
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmail(value);

                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: "" }));
                    }

                    validateForm({ name, email: value, password });
                  }}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/5 focus:border-primary transition-all outline-none placeholder:text-slate-400
${email && errors.email ? "border-red-500" : ""}
${email && !errors.email ? "border-green-500" : "border-border-light"}`}
                  placeholder="rahul@company.com"
                  type="email"
                  required
                />
                {touched.email && errors.email && (
                  <p className="text-red-500 text-xs mt-1 transition-all duration-300 animate-fade-in">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPassword(value);

                      if (errors.password) {
                        setErrors((prev) => ({ ...prev, password: "" }));
                      }

                      validateForm({ name, email, password: value });
                    }}
                    onBlur={() => setTouched({ ...touched, password: true })}
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/5 focus:border-primary transition-all outline-none placeholder:text-slate-400
${password && errors.password ? "border-red-500" : ""}
${password && !errors.password ? "border-green-500" : "border-border-light"}`}
                    placeholder="Min. 8 characters"
                    type={showPassword ? "text" : "password"}
                    required
                  />

                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="h-2 rounded bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          getPasswordStrength() <= 2
                            ? "bg-red-500 w-1/4"
                            : getPasswordStrength() === 3
                              ? "bg-yellow-500 w-2/4"
                              : getPasswordStrength() === 4
                                ? "bg-blue-500 w-3/4"
                                : getPasswordStrength() === 5
                                  ? "bg-green-500 w-full"
                                  : "w-0"
                        }`}
                      />
                    </div>

                    <p className="text-xs mt-1 text-gray-500">
                      Strength:{" "}
                      {getPasswordStrength() <= 2
                        ? "Weak"
                        : getPasswordStrength() === 3
                          ? "Moderate"
                          : getPasswordStrength() === 4
                            ? "Strong"
                            : "Very Strong"}
                    </p>
                  </div>
                )}
                {touched.password && errors.password && (
                  <p className="text-red-500 text-xs mt-1 transition-all duration-300 animate-fade-in">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isValid || loading}
                className={`w-full py-3.5 rounded-xl font-bold mt-4 transition-all press-scale
  ${isValid ? "bg-primary text-white hover:bg-primary-hover hover-lift" : "bg-gray-300 text-gray-500 cursor-not-allowed"}
`}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-border-light text-center">
              <p className="text-sm text-slate-600">
                Already have an account?
                <button
                  onClick={() => navigate("/signin")}
                  className="font-bold text-primary hover:underline ml-1"
                >
                  Sign In
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
