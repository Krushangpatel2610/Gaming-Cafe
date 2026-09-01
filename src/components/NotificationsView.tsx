import React, { useState } from "react";
import { motion } from "motion/react";
import { Send, Users, CheckSquare, Square } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { sendNotification } from "../api/notifications";
import { ApiCustomer, ApiNotificationChannel } from "../api/types";

interface NotificationsViewProps {
  customers: ApiCustomer[];
  onNotify: (message: string, severity: "info" | "success" | "danger" | "warning") => void;
}

const CHANNELS: ApiNotificationChannel[] = ["in_app", "email", "push", "sms"];

export default function NotificationsView({ customers, onNotify }: NotificationsViewProps) {
  const { storeId, admin } = useAuth();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<ApiNotificationChannel>("in_app");
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);

  const canSend = admin?.role === "super_admin" || admin?.role === "admin";

  const toggleAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map((c) => c.userId)));
    }
  };

  const toggleOne = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || selectedIds.size === 0) return;
    setSending(true);
    try {
      const result = await sendNotification(storeId, {
        userIds: Array.from(selectedIds),
        channel,
        title,
        body,
      });
      onNotify(`Notification sent to ${result.sent} customer(s).`, "success");
      setTitle("");
      setBody("");
      setSelectedIds(new Set());
    } catch (err) {
      onNotify(`Failed to send notification: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    } finally {
      setSending(false);
    }
  };

  if (!canSend) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white p-10 rounded-xl border border-slate-200 shadow-precision text-center text-slate-400 text-sm">
        Only admins and super admins can send notifications.
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <h2 className="text-xl font-bold text-slate-900 font-display">Send Notification</h2>
        <p className="text-xs text-slate-400 mt-1">Broadcast a message to customers — respects each customer's own channel preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipient picker */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-500" />Recipients ({selectedIds.size})</span>
            <button type="button" onClick={toggleAll} className="text-[11px] font-semibold text-indigo-600">
              {selectedIds.size === customers.length ? "Clear all" : "Select all"}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-96 divide-y divide-slate-50">
            {customers.map((c) => (
              <button key={c.userId} type="button" onClick={() => toggleOne(c.userId)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-slate-50">
                {selectedIds.has(c.userId) ? <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-300 shrink-0" />}
                <span className="text-xs text-slate-700 truncate">{c.name || c.phone || c.userId.slice(0, 8)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Compose form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-precision p-6">
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Channel</label>
              <div className="grid grid-cols-4 gap-2">
                {CHANNELS.map((c) => (
                  <button key={c} type="button" onClick={() => setChannel(c)} className={`py-2 text-[11px] font-bold rounded-lg border capitalize ${channel === c ? "bg-indigo-600 border-indigo-700 text-white" : "bg-slate-50 border-slate-200 text-slate-600"}`}>{c.replace("_", " ")}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Title</label>
              <input required maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. Weekend happy hour!" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Message</label>
              <textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Your message to customers..." />
            </div>
            <button
              type="submit"
              disabled={sending || selectedIds.size === 0}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? "Sending…" : `Send to ${selectedIds.size} customer(s)`}</span>
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
