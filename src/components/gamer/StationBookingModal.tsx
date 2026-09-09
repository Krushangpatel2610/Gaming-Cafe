import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Calendar,
  Clock,
  Monitor,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap
} from "lucide-react";
import { ApiAvailableSystem, ApiSystemType } from "../../api/types";
import { createBooking, payBooking } from "../../api/bookings";
import { ApiError } from "../../api/client";

interface StationBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: ApiAvailableSystem | null;
  systems: ApiAvailableSystem[];
  systemTypes: ApiSystemType[];
  balance: number;
  storeId: string;
  onBookingSuccess: () => void;
  onOpenTopUp: () => void;
}

export default function StationBookingModal({
  isOpen,
  onClose,
  system,
  systems,
  systemTypes,
  balance,
  storeId,
  onBookingSuccess,
  onOpenTopUp
}: StationBookingModalProps) {
  const [selectedSystemId, setSelectedSystemId] = useState<string>(system?.id || "");
  const [durationHours, setDurationHours] = useState<number>(2);
  const [startOffsetMinutes, setStartOffsetMinutes] = useState<number>(0);
  const [autoPayWithCredits, setAutoPayWithCredits] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync selected system if modal opens with a pre-picked system
  React.useEffect(() => {
    if (system?.id) {
      setSelectedSystemId(system.id);
    } else if (systems.length > 0 && !selectedSystemId) {
      setSelectedSystemId(systems[0].id);
    }
  }, [system, systems, selectedSystemId]);

  if (!isOpen) return null;

  const currentSystem = systems.find((s) => s.id === selectedSystemId) || system;

  // Derive hourly rate from systemTypes if available, fallback to 120/hr
  const systemType = systemTypes.find((t) => t.id === currentSystem?.systemTypeId);
  const hourlyRate = systemType ? parseFloat(systemType.hourlyBaseRate) : 120;
  const estimatedCost = hourlyRate * durationHours;
  const canAfford = balance >= estimatedCost;

  // Calculate start and end ISO strings
  const now = new Date();
  const startTime = new Date(now.getTime() + startOffsetMinutes * 60 * 1000);
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

  const startPresets = [
    { label: "Now (Instant)", offset: 0 },
    { label: "+15 Mins", offset: 15 },
    { label: "+30 Mins", offset: 30 },
    { label: "+1 Hour", offset: 60 },
    { label: "+2 Hours", offset: 120 }
  ];

  const durationPresets = [1, 2, 3, 4, 6];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSystem || !storeId) return;

    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const scheduledStart = startTime.toISOString();
      const scheduledEnd = endTime.toISOString();

      const { booking } = await createBooking(storeId, {
        systemId: currentSystem.id,
        scheduledStart,
        scheduledEnd,
        notes: notes.trim() || undefined
      });

      // If user wants to pay with credits and can afford it
      if (autoPayWithCredits && canAfford) {
        try {
          await payBooking(storeId, booking.id);
        } catch (payErr) {
          // Booking was still reserved even if immediate auto-pay had an issue
          console.warn("Auto-pay encountered an issue:", payErr);
        }
      }

      setSuccessMessage(
        `Station reserved successfully! ${
          autoPayWithCredits && canAfford ? "Paid with credits." : "Pay at the front desk or from My Bookings."
        }`
      );

      setTimeout(() => {
        onBookingSuccess();
        onClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create booking reservation.");
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
        className="relative w-full max-w-lg bg-[#0d121f] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
      >
        {/* Top accent gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Book a Gaming Rig</h3>
              <p className="text-[11px] text-slate-400 font-mono">Reserve your station in advance</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Station Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase font-mono tracking-wider text-slate-300 mb-2">
              Select Rig / Station
            </label>
            <select
              value={selectedSystemId}
              onChange={(e) => setSelectedSystemId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/[0.1] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {systems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (#{s.stationNumber}) — {s.platform.toUpperCase()}
                </option>
              ))}
            </select>

            {currentSystem && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold">{currentSystem.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    {currentSystem.platform}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-slate-400 text-[10px]">Rate: </span>
                  <span className="text-white font-bold">₹{hourlyRate.toFixed(0)}/hr</span>
                </div>
              </div>
            )}
          </div>

          {/* Start Time Presets */}
          <div>
            <label className="block text-[11px] font-bold uppercase font-mono tracking-wider text-slate-300 mb-2">
              When to Start
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {startPresets.map((p) => (
                <button
                  type="button"
                  key={p.offset}
                  onClick={() => setStartOffsetMinutes(p.offset)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-mono transition-all border ${
                    startOffsetMinutes === p.offset
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 font-bold"
                      : "bg-slate-900 text-slate-300 border-white/[0.06] hover:border-white/20"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1.5">
              Scheduled for: {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase font-mono tracking-wider text-slate-300 mb-2">
              Duration
            </label>
            <div className="grid grid-cols-5 gap-2">
              {durationPresets.map((hrs) => (
                <button
                  type="button"
                  key={hrs}
                  onClick={() => setDurationHours(hrs)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-mono transition-all border ${
                    durationHours === hrs
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 font-bold"
                      : "bg-slate-900 text-slate-300 border-white/[0.06] hover:border-white/20"
                  }`}
                >
                  {hrs} {hrs === 1 ? "Hour" : "Hours"}
                </button>
              ))}
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-[11px] font-bold uppercase font-mono tracking-wider text-slate-300 mb-1.5">
              Gamer Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Tournament match, squad practice"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/[0.1] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Cost & Payment Summary Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/25 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Estimated Total ({durationHours} hrs)</span>
              <span className="text-base font-bold text-white font-mono">
                ₹{estimatedCost.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                <span>Available Credits:</span>
              </div>
              <span className={`font-mono font-bold ${canAfford ? "text-emerald-400" : "text-amber-400"}`}>
                ₹{balance.toFixed(2)}
              </span>
            </div>

            {/* Auto-pay checkbox if user has balance */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={autoPayWithCredits}
                  onChange={(e) => setAutoPayWithCredits(e.target.checked)}
                  disabled={!canAfford}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Instant pay with wallet balance</span>
              </label>

              {!canAfford && (
                <button
                  type="button"
                  onClick={onOpenTopUp}
                  className="text-[11px] font-mono font-semibold text-indigo-400 hover:text-indigo-300 underline"
                >
                  Top Up
                </button>
              )}
            </div>
          </div>

          {/* Modal Actions */}
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
              disabled={submitting || !currentSystem}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold font-mono tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reserving...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-indigo-200" />
                  <span>Confirm Reservation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
