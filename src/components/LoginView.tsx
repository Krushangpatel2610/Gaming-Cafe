import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gamepad2, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2,
  Loader2, ArrowLeft, KeyRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { adminRequestPasswordReset, adminConfirmPasswordReset } from "../api/auth";
import { listActiveStores } from "../api/stores";
import { ApiError } from "../api/client";
import { ApiStore } from "../api/types";

type Mode = "login" | "forgot-request" | "forgot-confirm";

interface LoginViewProps {
  onSwitchToSignup: () => void;
}

export default function LoginView({ onSwitchToSignup }: LoginViewProps) {
  const { login, userLogin, error } = useAuth();
  const isDesktop = typeof window !== "undefined" && window.__DESKTOP_APP__ === true;
  const [mode, setMode] = useState<Mode>("login");

  // Shared credentials
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Pre-fetch the single store in the background so player login can use it
  const [store, setStore] = useState<ApiStore | null>(null);
  useEffect(() => {
    listActiveStores({ limit: 1 })
      .then(({ data }) => { if (data.length > 0) setStore(data[0]); })
      .catch(() => {});
  }, []);

  // Forgot password
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  /**
   * Try admin login first; if that fails with 401, fall back to player login
   * using the pre-fetched single store.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await login(identifier, password);
    } catch (adminErr) {
      // Admin login failed — try player
      const storeId = store?.id;
      if (!storeId) {
        setLocalError("Invalid email or password.");
        setSubmitting(false);
        return;
      }
      try {
        await userLogin(identifier, password, storeId);
      } catch (playerErr) {
        setLocalError(
          playerErr instanceof ApiError ? playerErr.message : "Invalid email or password."
        );
      }
    }
    setSubmitting(false);
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSubmitting(true);
    try {
      await adminRequestPasswordReset(resetEmail);
      setResetNotice(`If an account exists for ${resetEmail}, a 6-digit code was just emailed to it.`);
      setMode("forgot-confirm");
    } catch (err) {
      setResetError(err instanceof ApiError ? err.message : "Couldn't send the reset code. Try again.");
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSubmitting(true);
    try {
      await adminConfirmPasswordReset(resetEmail, resetCode, resetPassword);
      setMode("login");
      setIdentifier(resetEmail);
      setPassword("");
      setResetCode("");
      setResetPassword("");
      setResetNotice("Password reset — sign in with your new credentials.");
    } catch (err) {
      setResetError(err instanceof ApiError ? err.message : "That code didn't work. Check it and try again.");
    } finally {
      setResetSubmitting(false);
    }
  };

  const displayError = localError || (error && !submitting ? error : null);

  return (
    <div className="min-h-screen bg-slate-950 overflow-y-auto relative">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 pointer-events-none" />
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-2xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

            {/* Header */}
            <div className="px-8 pt-8 pb-5 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4"
              >
                <Gamepad2 className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">10x10</h1>
              <p className="text-xs text-slate-400 mt-1">
                {mode === "login"
                  ? "Sign in to your account"
                  : mode === "forgot-request"
                  ? "Reset your password"
                  : "Enter your code and a new password"}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {/* ── LOGIN ── */}
              {mode === "login" && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className="pb-7"
                >
                  <form onSubmit={handleSubmit} className="px-8 space-y-4">
                    {resetNotice && (
                      <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg p-3">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{resetNotice}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                          placeholder="you@yourlounge.com"
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => { setMode("forgot-request"); setResetEmail(identifier); setResetNotice(null); }}
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {displayError && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{displayError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{submitting ? "Signing in..." : "Sign In"}</span>
                    </button>

                    {!isDesktop && (
                      <button
                        type="button"
                        onClick={onSwitchToSignup}
                        className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        No account? <span className="text-indigo-600">Sign up</span>
                      </button>
                    )}
                  </form>
                </motion.div>
              )}

              {/* ── FORGOT REQUEST ── */}
              {mode === "forgot-request" && (
                <motion.form
                  key="forgot-request"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRequestCode}
                  className="px-8 pb-8 space-y-4"
                >
                  <p className="text-xs text-slate-500">
                    Enter your account email and we'll send a 6-digit code to reset your password.
                  </p>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        placeholder="you@yourlounge.com"
                        autoComplete="username"
                      />
                    </div>
                  </div>
                  {resetError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{resetError}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    {resetSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{resetSubmitting ? "Sending code..." : "Send Reset Code"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to sign in</span>
                  </button>
                </motion.form>
              )}

              {/* ── FORGOT CONFIRM ── */}
              {mode === "forgot-confirm" && (
                <motion.form
                  key="forgot-confirm"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleConfirmReset}
                  className="px-8 pb-8 space-y-4"
                >
                  {resetNotice && (
                    <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg p-3">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{resetNotice}</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">6-Digit Code</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        maxLength={6}
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-sm tracking-[0.4em] font-mono rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        placeholder="000000"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showResetPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {resetError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{resetError}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    {resetSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{resetSubmitting ? "Resetting..." : "Reset Password"}</span>
                  </button>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setMode("forgot-request")}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Resend code
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back to sign in
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-[11px] text-slate-500 mt-5">
            10x10 Gaming Zone
          </p>
        </motion.div>
      </div>
    </div>
  );
}
