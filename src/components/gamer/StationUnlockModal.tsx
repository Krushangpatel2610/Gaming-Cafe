import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  QrCode,
  Monitor,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Sparkles
} from "lucide-react";
import { ApiAvailableSystem } from "../../api/types";
import { qrLogin, stationLogin } from "../../api/sessions";
import { ApiError } from "../../api/client";

interface StationUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  systems: ApiAvailableSystem[];
  storeId: string;
  onUnlockSuccess: () => void;
}

export default function StationUnlockModal({
  isOpen,
  onClose,
  systems,
  storeId,
  onUnlockSuccess
}: StationUnlockModalProps) {
  const [method, setMethod] = useState<"token" | "station">("token");
  const [tokenInput, setTokenInput] = useState<string>("");
  const [selectedSystemId, setSelectedSystemId] = useState<string>(
    systems.length > 0 ? systems[0].id : ""
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (method === "token") {
        const cleanToken = tokenInput.trim();
        if (!cleanToken) {
          setError("Please enter the 6-character token from the station screen.");
          setSubmitting(false);
          return;
        }
        await qrLogin(storeId, cleanToken);
        setSuccess("Station verified and unlocked! Your session has begun.");
      } else {
        if (!selectedSystemId) {
          setError("Please select a station to connect.");
          setSubmitting(false);
          return;
        }
        await stationLogin(storeId, selectedSystemId);
        setSuccess("Station linked and session started!");
      }

      setTimeout(() => {
        onUnlockSuccess();
        onClose();
        setSuccess(null);
        setTokenInput("");
      }, 1400);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not unlock station. Check token or try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-[#0d121f] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
      >
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Station Unlock</h3>
              <p className="text-[11px] text-slate-400 font-mono">Connect & play on physical rig</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Method Toggle */}
        <div className="p-5 pb-0">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900/80 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setMethod("token")}
              className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 ${
                method === "token"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Screen Code / QR</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod("station")}
              className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 ${
                method === "station"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Pick Station</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {method === "token" ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Look at the locked screen of your gaming PC. Enter the temporary 6-digit or code token displayed under the QR code:
              </p>

              <div className="relative">
                <input
                  type="text"
                  maxLength={12}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  placeholder="e.g. A4K9X2"
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-900 border border-white/[0.1] text-white text-lg font-mono tracking-widest text-center focus:outline-none focus:border-indigo-500 transition-colors uppercase placeholder:text-slate-600 font-bold"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-300">
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>If you already have a booking for this station, it will link automatically!</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Select an available gaming terminal on the floor to start your session immediately:
              </p>

              <select
                value={selectedSystemId}
                onChange={(e) => setSelectedSystemId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/[0.1] text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              >
                {systems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (#{s.stationNumber}) — {s.platform.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/5 text-xs font-semibold font-mono transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold font-mono tracking-wider transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-emerald-200" />
                  <span>Unlock Station</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
