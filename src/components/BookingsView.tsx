import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X, Timer } from "lucide-react";
import { PC } from "../types";
import { ApiBooking, ApiCustomer } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { listBookings, extendBooking } from "../api/bookings";
import { createWalkInBooking } from "../api/bookings";
import { ApiError } from "../api/client";

interface BookingsViewProps {
  pcs: PC[];
  customers: ApiCustomer[];
  onNotify: (message: string, severity: "info" | "success" | "danger" | "warning") => void;
}

const PX_PER_MIN = 1.2;
const DAY_START_HOUR = 6; // schedule window starts at 6am
const DAY_END_HOUR = 26; // ends at 2am next day
const VISIBLE_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

function toDateInputValue(d: Date): string {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function minutesFromWindowStart(iso: string, dayStr: string): number {
  const d = new Date(iso);
  const dayStart = new Date(`${dayStr}T00:00:00`);
  const mins = (d.getTime() - dayStart.getTime()) / 60000 - DAY_START_HOUR * 60;
  return mins;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 border-amber-300 text-amber-800",
  confirmed: "bg-indigo-100 border-indigo-300 text-indigo-800",
  checked_in: "bg-emerald-100 border-emerald-300 text-emerald-800",
  cancelled: "bg-slate-100 border-slate-300 text-slate-500 line-through",
  no_show: "bg-red-100 border-red-300 text-red-700",
};

export default function BookingsView({ pcs, customers, onNotify }: BookingsViewProps) {
  const { storeId } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(toDateInputValue(new Date()));
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<ApiBooking | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState<boolean>(false);
  const [walkInSystemId, setWalkInSystemId] = useState<string>("");
  const [walkInCustomerId, setWalkInCustomerId] = useState<string>("");
  const [walkInPhone, setWalkInPhone] = useState<string>("");

  const refresh = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const { data } = await listBookings(storeId, { date: selectedDate, limit: 100 });
      setBookings(data);
    } catch (err) {
      onNotify(`Failed to load bookings: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, selectedDate]);

  const hourLabels = useMemo(() => {
    const labels: string[] = [];
    for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
      const hour24 = h % 24;
      const label = hour24 === 0 ? "12 AM" : hour24 < 12 ? `${hour24} AM` : hour24 === 12 ? "12 PM" : `${hour24 - 12} PM`;
      labels.push(label);
    }
    return labels;
  }, []);

  const shiftDate = (deltaDays: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(toDateInputValue(d));
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !walkInSystemId) return;
    try {
      await createWalkInBooking(storeId, {
        systemId: walkInSystemId,
        userId: walkInCustomerId || undefined,
        walkInPhone: walkInPhone || undefined,
      });
      onNotify("Walk-in booking created.", "success");
      setShowWalkInModal(false);
      setWalkInSystemId("");
      setWalkInCustomerId("");
      setWalkInPhone("");
      await refresh();
    } catch (err) {
      onNotify(`Failed to create walk-in: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const handleExtend = async (bookingId: string, additionalMinutes: number) => {
    if (!storeId || !selectedBooking) return;
    const newEnd = new Date(new Date(selectedBooking.scheduledEnd).getTime() + additionalMinutes * 60000);
    try {
      await extendBooking(storeId, bookingId, newEnd.toISOString());
      onNotify("Booking extended.", "success");
      setSelectedBooking(null);
      await refresh();
    } catch (err) {
      onNotify(`Failed to extend booking: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const activeSystems = pcs.length > 0 ? pcs : [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Bookings & Reservations</h2>
          <p className="text-xs text-slate-400 mt-1">Day schedule across all terminals — reservations, walk-ins, and check-ins.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 p-1">
            <button onClick={() => shiftDate(-1)} className="p-1.5 hover:bg-white rounded-md text-slate-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none"
              />
            </div>
            <button onClick={() => shiftDate(1)} className="p-1.5 hover:bg-white rounded-md text-slate-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setSelectedDate(toDateInputValue(new Date()))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            onClick={() => setShowWalkInModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Walk-in</span>
          </button>
        </div>
      </div>

      {/* Calendar / schedule grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden">
        {activeSystems.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No terminals registered yet — add one from Live PCs.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex min-w-max">
              {/* Time gutter */}
              <div className="w-16 shrink-0 border-r border-slate-100 pt-10">
                {hourLabels.map((label, i) => (
                  <div
                    key={i}
                    style={{ height: `${60 * PX_PER_MIN}px` }}
                    className="text-[10px] text-slate-400 font-mono text-right pr-2 -translate-y-2"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* System columns */}
              {activeSystems.map((pc) => {
                const dayBookings = bookings.filter((b) => b.systemId === pc.id && b.status !== "cancelled" && b.status !== "no_show");
                return (
                  <div key={pc.id} className="w-48 shrink-0 border-r border-slate-100 relative">
                    <div className="h-10 border-b border-slate-100 flex items-center justify-center sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10">
                      <span className="text-xs font-bold text-slate-700 truncate px-2">{pc.name}</span>
                    </div>
                    <div className="relative" style={{ height: `${VISIBLE_MINUTES * PX_PER_MIN}px` }}>
                      {/* hour gridlines */}
                      {hourLabels.map((_, i) => (
                        <div
                          key={i}
                          className="absolute left-0 right-0 border-t border-slate-50"
                          style={{ top: `${i * 60 * PX_PER_MIN}px` }}
                        />
                      ))}
                      {dayBookings.map((b) => {
                        const top = minutesFromWindowStart(b.scheduledStart, selectedDate) * PX_PER_MIN;
                        const durationMin = (new Date(b.scheduledEnd).getTime() - new Date(b.scheduledStart).getTime()) / 60000;
                        const height = Math.max(durationMin * PX_PER_MIN, 22);
                        const custName = b.userId
                          ? customers.find((c) => c.userId === b.userId)?.name || `Member ${b.userId.slice(0, 6)}`
                          : b.walkInPhone || "Walk-in";
                        return (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBooking(b)}
                            style={{ top: `${Math.max(top, 0)}px`, height: `${height}px` }}
                            className={`absolute left-1 right-1 rounded-md border px-2 py-1 text-left overflow-hidden shadow-sm hover:brightness-95 transition-all ${STATUS_COLORS[b.status] || "bg-slate-100 border-slate-300"}`}
                          >
                            <p className="text-[10px] font-bold truncate">{custName}</p>
                            <p className="text-[9px] font-mono opacity-75">
                              {new Date(b.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–
                              {new Date(b.scheduledEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {loading && <div className="p-3 text-center text-[10px] text-slate-400 font-mono border-t border-slate-100">Refreshing…</div>}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] font-mono text-slate-500">
        {Object.entries(STATUS_COLORS).map(([status, cls]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border ${cls.split(" ").slice(0, 2).join(" ")}`} />
            <span className="capitalize">{status.replace("_", " ")}</span>
          </div>
        ))}
      </div>

      {/* MODAL: Booking Detail / Extend */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Booking Detail</h3>
                <p className="text-xs text-slate-400 mt-1">{pcs.find((p) => p.id === selectedBooking.systemId)?.name || selectedBooking.systemId}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Status</span><span className={`px-2 py-0.5 rounded-full font-bold border ${STATUS_COLORS[selectedBooking.status]}`}>{selectedBooking.status}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="font-semibold text-slate-700">{selectedBooking.bookingType}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Start</span><span className="font-mono text-slate-700">{new Date(selectedBooking.scheduledStart).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">End</span><span className="font-mono text-slate-700">{new Date(selectedBooking.scheduledEnd).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Paid</span><span className="font-semibold text-slate-700">{selectedBooking.isPaid ? "Yes" : "No"}</span></div>
              {selectedBooking.notes && <div className="pt-2 border-t border-slate-100"><span className="text-slate-400 block mb-1">Notes</span><span className="text-slate-600">{selectedBooking.notes}</span></div>}

              {["pending", "confirmed", "checked_in"].includes(selectedBooking.status) && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1"><Timer className="w-3 h-3" /> Extend by</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 60, 120].map((m) => (
                      <button key={m} onClick={() => handleExtend(selectedBooking.id, m)} className="py-1.5 text-[11px] font-bold rounded-lg border bg-slate-50 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700">
                        +{m}m
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: Walk-in */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">New Walk-in Booking</h3>
              <p className="text-xs text-slate-400 mt-1">Immediate check-in, standard 2-hour block.</p>
            </div>
            <form onSubmit={handleWalkInSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Terminal</label>
                <select required value={walkInSystemId} onChange={(e) => setWalkInSystemId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="">-- Select terminal --</option>
                  {activeSystems.map((pc) => (
                    <option key={pc.id} value={pc.id}>{pc.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Registered Member (optional)</label>
                <select value={walkInCustomerId} onChange={(e) => setWalkInCustomerId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none">
                  <option value="">-- Guest (no account) --</option>
                  {customers.filter((c) => !c.isSuspended).map((c) => (
                    <option key={c.userId} value={c.userId}>{c.name || c.phone || c.userId.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
              {!walkInCustomerId && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Guest Phone (optional)</label>
                  <input type="tel" value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)} placeholder="+15550001234" className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none" />
                </div>
              )}
              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowWalkInModal(false)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10">Create Booking</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
