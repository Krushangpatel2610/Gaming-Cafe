import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  Tag,
  AlertCircle,
  Loader2,
  CheckCheck,
  Gamepad2
} from "lucide-react";
import { ApiNotification } from "../../api/types";
import { getMyNotifications, markAllNotificationsRead } from "../../api/notifications";

interface GamerNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function GamerNotificationsModal({
  isOpen,
  onClose,
  onUpdated
}: GamerNotificationsModalProps) {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [marking, setMarking] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getMyNotifications(1, 30)
        .then((res) => {
          setNotifications(res.notifications || []);
        })
        .catch(() => setNotifications([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "read" as const }))
      );
      onUpdated();
    } catch {
      // Non-fatal
    } finally {
      setMarking(false);
    }
  };

  const formatNotificationTime = (iso: string) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-[#0d121f] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Notifications</h3>
              <p className="text-[11px] text-slate-400 font-mono">Alerts, Bookings & Promos</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.some((n) => n.status !== "read") && (
              <button
                onClick={handleMarkAllRead}
                disabled={marking}
                className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs font-mono">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 mx-auto flex items-center justify-center text-slate-600">
                <Bell className="w-5 h-5" />
              </div>
              <p>You're all caught up! No notifications right now.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = n.status !== "read";
              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isUnread
                      ? "bg-indigo-950/25 border-indigo-500/30 text-white"
                      : "bg-slate-900/60 border-white/[0.06] text-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isUnread ? "bg-pink-400 animate-pulse" : "bg-transparent"
                        }`}
                      />
                      <p className="text-xs font-bold font-mono tracking-tight">{n.title}</p>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {formatNotificationTime(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 pl-4 leading-relaxed">{n.body}</p>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
