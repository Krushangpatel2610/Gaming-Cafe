import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gamepad2, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2,
  Loader2, ArrowLeft, KeyRound, Users, Search, Shield, ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { adminRequestPasswordReset, adminConfirmPasswordReset } from "../api/auth";
import { listActiveStores } from "../api/stores";
import { ApiError } from "../api/client";
import { ApiStore } from "../api/types";

type Mode = "login" | "forgot-request" | "forgot-confirm";
type Role = "admin" | "player";
type PlayerStep = "store" | "credentials";

interface LoginViewProps {
  onSwitchToSignup: () => void;
}

export default function LoginView({ onSwitchToSignup }: LoginViewProps) {
  const { login, userLogin, error } = useAuth();
  const isDesktop = typeof window !== "undefined" && window.__DESKTOP_APP__ === true;
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("admin");

  // Admin login
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Player login — step-based
  const [playerStep, setPlayerStep] = useState<PlayerStep>("store");
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState<ApiStore | null>(null);
  const [playerEmail, setPlayerEmail] = useState("");
  const [playerPassword, setPlayerPassword] = useState("");
  const [showPlayerPassword, setShowPlayerPassword] = useState(false);

  // Forgot password
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "player" || stores.length > 0) return;
    setStoresLoading(true);
    setStoresError(null);
    listActiveStores({ limit: 100 })
      .then(({ data }) => setStores(data))
      .catch(() => setStoresError("Couldn't load gaming zones. Check your connection."))
      .finally(() => setStoresLoading(false));
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredStores = stores.filter((s) => {
    const hay = `${s.name} ${s.city ?? ""} ${s.address ?? ""}`.toLowerCase();
    return hay.includes(storeSearch.toLowerCase());
  });

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await login(identifier, password);
    } catch {
      // surfaced via auth context error
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    setLocalError(null);
    setSubmitting(true);
    try {
      await userLogin(playerEmail, playerPassword, selectedStore.id);
    } catch (err) {
      setLocalError(err instanceof ApiError ? err.message : "Couldn't sign in. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectStore = (s: ApiStore) => {
    setSelectedStore(s);
    setPlayerStep("credentials");
  };

  const changeStore = () => {
    setSelectedStore(null);
    setPlayerStep("store");
    setLocalError(null);
  };

  const switchRole = (r: Role) => {
    setRole(r);
    setLocalError(null);
    setPlayerStep("store");
    setSelectedStore(null);
    setStoreSearch("");
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
      setResetNotice("Password reset — sign in with your new password.");
    } catch (err) {
      setResetError(err instanceof ApiError ? err.message : "That code didn't work. Check it and try again.");
    } finally {
      setResetSubmitting(false);
    }
  };

  const displayError = localError || error;

  const subtitle =
    mode === "login"
      ? role === "admin"
        ? "Sign in to the operations dashboard"
        : playerStep === "store"
        ? "Choose your gaming zone"
        : `Signing in to ${selectedStore?.name}`
      : mode === "forgot-request"
      ? "Reset your password"
      : "Enter your code and a new password";

  return (
    // Fixed background + scrollable foreground so the card never clips on short viewports
    <div className="min-h-screen bg-slate-950 overflow-y-auto relative">
      {/* Background — fixed so it doesn't participate in scroll height */}
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

      {/* Scrollable content */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-2xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

            {/* Card header */}
            <div className="px-8 pt-8 pb-5 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4"
              >
                <Gamepad2 className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">GameCentral</h1>
              <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            </div>

            <AnimatePresence mode="wait">
              {/* ── LOGIN ───────────────────────────────────────────────── */}
              {mode === "login" && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className="pb-7"
                >
                  {/* Role toggle — hidden in desktop app (admin-only) */}
                  {!isDesktop && (
                    <div className="px-8 mb-5">
                      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => switchRole("admin")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            role === "admin"
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Admin
                        </button>
                        <button
                          type="button"
                          onClick={() => switchRole("player")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                            role === "player"
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          Player
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Admin form ── */}
                  {role === "admin" && (
                    <form onSubmit={handleAdminSubmit} className="px-8 space-y-4">
                      {resetNotice && (
                        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg p-3">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{resetNotice}</span>
                        </div>
                      )}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Email or Phone
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
                          No account? <span className="text-indigo-600">Sign up your gaming zone</span>
                        </button>
                      )}
                    </form>
                  )}

                  {/* ── Player — Step 1: pick store ── */}
                  {role === "player" && playerStep === "store" && (
                    <div className="px-8 space-y-3">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={storeSearch}
                          onChange={(e) => setStoreSearch(e.target.value)}
                          placeholder="Search by name or city..."
                          autoFocus
                          className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        />
                      </div>

                      {storesError ? (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{storesError}</span>
                        </div>
                      ) : storesLoading ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading gaming zones...</span>
                        </div>
                      ) : filteredStores.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-5">
                          {storeSearch ? "No zones match your search" : "No gaming zones available"}
                        </p>
                      ) : (
                        <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                          {filteredStores.slice(0, 20).map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => selectStore(s)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50 text-left transition-colors group"
                            >
                              <div>
                                <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-700">{s.name}</p>
                                {s.city && <p className="text-[10px] text-slate-400 mt-0.5">{s.city}</p>}
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={onSwitchToSignup}
                        className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        No account? <span className="text-indigo-600">Create player account</span>
                      </button>
                    </div>
                  )}

                  {/* ── Player — Step 2: credentials ── */}
                  {role === "player" && playerStep === "credentials" && (
                    <form onSubmit={handlePlayerSubmit} className="px-8 space-y-4">
                      {/* Selected store badge */}
                      <button
                        type="button"
                        onClick={changeStore}
                        className="w-full flex items-center justify-between bg-indigo-50 border border-indigo-200/60 rounded-xl px-4 py-2.5 group hover:border-indigo-400 transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-xs font-bold text-indigo-800">{selectedStore?.name}</p>
                          {selectedStore?.city && <p className="text-[10px] text-indigo-500 mt-0.5">{selectedStore.city}</p>}
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-500 group-hover:text-indigo-700 shrink-0">Change</span>
                      </button>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            autoFocus
                            value={playerEmail}
                            onChange={(e) => setPlayerEmail(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                            placeholder="your@email.com"
                            autoComplete="username"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPlayerPassword ? "text" : "password"}
                            required
                            value={playerPassword}
                            onChange={(e) => setPlayerPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                            placeholder="••••••••"
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPlayerPassword(!showPlayerPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            tabIndex={-1}
                          >
                            {showPlayerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                        <span>{submitting ? "Signing in..." : "Sign In as Player"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={onSwitchToSignup}
                        className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        No account? <span className="text-indigo-600">Create player account</span>
                      </button>
                    </form>
                  )}
                </motion.div>
              )}

              {/* ── FORGOT REQUEST ───────────────────────────────────────── */}
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

              {/* ── FORGOT CONFIRM ───────────────────────────────────────── */}
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
            GameCentral Operations Platform
          </p>
        </motion.div>
      </div>
    </div>
  );
}
