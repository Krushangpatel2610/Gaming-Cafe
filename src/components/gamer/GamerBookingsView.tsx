import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CreditCard,
  Loader2,
  Calendar,
  Zap,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { ApiBooking, ApiAvailableSystem } from "../../api/types";
import { getMyBookings, payBooking, cancelBooking, checkInBooking } from "../../api/bookings";
import { ApiError } from "../../api/client";

interface GamerBookingsViewProps {
  storeId: string;
  systems: ApiAvailableSystem[];
  onOpenBooking: () => void;
  onOpenTopUp: () => void;
  onSessionStarted?: () => void;
}

export default function GamerBookingsView({
  storeId,
  systems,
  onOpenBooking,
  onOpenTopUp,
  onSessionStarted
}: GamerBookingsViewProps) {
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "pending" | "past">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async (silent = false) => {
    if (!storeId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setActionError(null);

    try {
      const res = await getMyBookings(storeId, { limit: 50 });
      setBookings(res.data || []);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't load your bookings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handlePay = async (bookingId: string) => {
    setProcessingId(bookingId);
    setActionError(null);
    setActionSuccess(null);
    try {
      await payBooking(storeId, bookingId);
      setActionSuccess("Booking paid and confirmed with your wallet credits!");
      await fetchBookings(true);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Payment failed. Please check credits balance.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setProcessingId(bookingId);
    setActionError(null);
    setActionSuccess(null);
    try {
      await cancelBooking(storeId, bookingId);
      setActionSuccess("Booking reservation cancelled.");
      await fetchBookings(true);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not cancel booking.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    setProcessingId(bookingId);
    setActionError(null);
    setActionSuccess(null);
    try {
      await checkInBooking(storeId, bookingId);
      setActionSuccess("Checked in! Your session is starting on your assigned station.");
      await fetchBookings(true);
      if (onSessionStarted) onSessionStarted();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not check in.");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return (
        d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
        " · " +
        d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return iso;
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return b.status === "confirmed" || b.status === "checked_in";
    if (filter === "pending") return b.status === "pending";
    if (filter === "past") return b.status === "cancelled" || b.status === "no_show";
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-display tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-indigo-400" />
            <span>My Bookings & Reservations</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Manage your scheduled PC slots, payment statuses, and instant cafe check-ins
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchBookings(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/[0.08] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
          </button>

          <button
            onClick={onOpenBooking}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Reserve New Slot</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {actionError && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div className="flex-1">
            <span>{actionError}</span>
            {actionError.toLowerCase().includes("credit") && (
              <button
                onClick={onOpenTopUp}
                className="ml-2 underline text-indigo-400 hover:text-indigo-300 font-bold"
              >
                Top up now
              </button>
            )}
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#0d121f] border border-white/[0.08] w-fit">
        {[
          { id: "all", label: "All Bookings" },
          { id: "upcoming", label: "Confirmed & Active" },
          { id: "pending", label: "Pending Payment" },
          { id: "past", label: "History & Cancelled" }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as typeof filter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all ${
              filter === t.id
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content list */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs font-mono rounded-3xl bg-[#0d121f] border border-white/[0.08]">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Loading your reservations...</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#0d121f] border border-white/[0.08] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 mx-auto flex items-center justify-center text-slate-600">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white font-mono">No Bookings Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't scheduled any station slots in this category.
            </p>
          </div>
          <button
            onClick={onOpenBooking}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-mono font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
          >
            Book a Station Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => {
            const system = systems.find((s) => s.id === b.systemId);
            const isProcessing = processingId === b.id;

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-[#0d121f] border border-white/[0.08] hover:border-indigo-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                        b.status === "confirmed"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                          : b.status === "checked_in"
                          ? "bg-cyan-950/60 text-cyan-400 border-cyan-500/30"
                          : b.status === "pending"
                          ? "bg-amber-950/60 text-amber-400 border-amber-500/30"
                          : "bg-slate-900 text-slate-400 border-white/[0.08]"
                      }`}
                    >
                      {b.status.replace("_", " ")}
                    </span>

                    <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-900 px-2 py-0.5 rounded-full">
                      {b.bookingType}
                    </span>

                    {b.isPaid && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Paid
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white font-display">
                      {system ? system.name : `Station #${b.systemId.slice(0, 6)}`}
                    </h4>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      {formatDateTime(b.scheduledStart)} — {new Date(b.scheduledEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {b.notes && (
                    <p className="text-xs text-slate-400 italic">"{b.notes}"</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
                  {/* If pending payment */}
                  {b.status === "pending" && (
                    <button
                      onClick={() => handlePay(b.id)}
                      disabled={isProcessing}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{isProcessing ? "Paying..." : "Pay with Wallet"}</span>
                    </button>
                  )}

                  {/* If confirmed & ready to check in */}
                  {b.status === "confirmed" && (
                    <button
                      onClick={() => handleCheckIn(b.id)}
                      disabled={isProcessing}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isProcessing ? "Checking in..." : "Check In Now"}</span>
                    </button>
                  )}

                  {/* Cancel button if pending or confirmed */}
                  {(b.status === "pending" || b.status === "confirmed") && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={isProcessing}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/30 text-slate-400 hover:text-red-400 text-xs font-mono transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
