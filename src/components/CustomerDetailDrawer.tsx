import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Users,
  Calendar,
  Mail,
  Phone,
  DollarSign,
  Clock,
  ShieldAlert,
  UserX,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  History,
  Loader2,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { getCustomerDetails, ApiCustomerDetails } from "../api/customers";
import { formatCurrency } from "../lib/currency";

interface CustomerDetailDrawerProps {
  storeId?: string;
  customerId: string | null;
  currency: string;
  onClose: () => void;
  onTopUp: (userId: string) => void;
  onToggleStatus: (userId: string, reason?: string) => void;
}

export default function CustomerDetailDrawer({
  storeId,
  customerId,
  currency,
  onClose,
  onTopUp,
  onToggleStatus,
}: CustomerDetailDrawerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ApiCustomerDetails | null>(null);
  const [activeTab, setActiveTab] = useState<"sessions" | "payments" | "gamepass" | "ledger">("sessions");
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!storeId || !customerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCustomerDetails(storeId, customerId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchDetails();
    } else {
      setData(null);
    }
  }, [customerId, storeId]);

  if (!customerId) return null;

  const cust = data?.customer;

  const formatMins = (minutes: number | null | undefined) => {
    const m = Math.max(0, Math.floor(Number(minutes || 0)));
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return h > 0 ? `${h}h ${remM}m` : `${remM}m`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        className="relative w-full max-w-2xl bg-white shadow-2xl z-10 flex flex-col h-full border-l border-slate-200"
      >
        {/* Top Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{cust?.name || "Customer Profile"}</h2>
                {cust?.isSuspended ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Suspended
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {cust?.email || "No email"}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {cust?.phone || "No phone"}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Joined {cust?.joinedAt ? new Date(cust.joinedAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDetails}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-medium">Loading customer profile &amp; history...</p>
          </div>
        ) : error ? (
          <div className="flex-1 p-8 text-center text-red-600 space-y-3">
            <AlertTriangle className="w-8 h-8 mx-auto text-red-500" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={fetchDetails}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-lg text-xs"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Action & Balance Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl">
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider block">Wallet Balance</span>
                <span className="text-lg font-bold font-mono text-indigo-950">
                  {formatCurrency(parseFloat(cust?.creditsBalance || "0").toFixed(2), currency)}
                </span>
              </div>

              <div className="bg-purple-50/50 border border-purple-100 p-3.5 rounded-xl">
                <span className="text-[10px] font-mono font-bold text-purple-600 uppercase tracking-wider block">Active Gamepass</span>
                <span className="text-lg font-bold font-mono text-purple-950">
                  {formatMins(cust?.activeGamepassMinutes)}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Total Spend</span>
                <span className="text-lg font-bold font-mono text-slate-800">
                  {formatCurrency(parseFloat(cust?.totalSpend || "0").toFixed(2), currency)}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Play Time</span>
                <span className="text-lg font-bold font-mono text-slate-800">
                  {formatMins(cust?.totalPlayMinutes)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => onTopUp(customerId)}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>Top-up Credits</span>
              </button>

              <button
                onClick={() => onToggleStatus(customerId, cust?.suspendedReason ?? undefined)}
                className={`px-4 py-2 border rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  !cust?.isSuspended
                    ? "bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border-slate-200 hover:border-red-200"
                    : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                }`}
              >
                {!cust?.isSuspended ? (
                  <>
                    <UserX className="w-4 h-4 text-red-500" />
                    <span>Suspend Customer</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Reactivate Customer</span>
                  </>
                )}
              </button>
            </div>

            {/* Sub-tab Navigation */}
            <div className="border-b border-slate-200 flex items-center gap-2 pt-2">
              <button
                onClick={() => setActiveTab("sessions")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === "sessions"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Sessions ({data?.sessions.length ?? 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("payments")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === "payments"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Payments &amp; Top-Ups ({data?.payments.length ?? 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("gamepass")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === "gamepass"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gamepasses ({data?.gamepasses.length ?? 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("ledger")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === "ledger"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Wallet Ledger ({data?.creditTransactions.length ?? 0})</span>
              </button>
            </div>

            {/* Tab 1: SESSIONS */}
            {activeTab === "sessions" && (
              <div className="space-y-3">
                {data?.sessions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No session history found for this customer.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {data?.sessions.map((sess) => {
                      const hasDue = parseFloat(sess.unpaidAmount || "0") > 0;
                      return (
                        <div key={sess.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{sess.systemName}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                sess.status === "in_progress"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}>
                                {sess.status}
                              </span>
                              {hasDue && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Due: {formatCurrency(parseFloat(sess.unpaidAmount).toFixed(2), currency)}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {new Date(sess.startedAt).toLocaleString()} · {sess.durationMinutes ?? 0}m played
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 block text-sm">
                              {formatCurrency(parseFloat(sess.billedAmount || "0").toFixed(2), currency)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">#{sess.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: PAYMENTS & TOP-UPS */}
            {activeTab === "payments" && (
              <div className="space-y-3">
                {data?.payments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No top-up or payment requests recorded.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {data?.payments.map((p) => {
                      const isPayLater = p.paymentMethod === "pay_later";
                      const isAllowed = p.status === "allowed";
                      const isConfirmed = p.status === "confirmed";
                      return (
                        <div key={p.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-sm">
                                {formatCurrency(parseFloat(p.amount).toFixed(2), currency)}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                isPayLater
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : p.paymentMethod === "cash"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-blue-100 text-blue-800 border border-blue-200"
                              }`}>
                                {p.paymentMethod || "UPI"}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                isConfirmed
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isAllowed
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : p.status === "rejected"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {isAllowed ? "Allowed (Unpaid)" : p.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {new Date(p.createdAt).toLocaleString()}
                              {p.utrReference ? ` · Ref: ${p.utrReference}` : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: GAMEPASSES */}
            {activeTab === "gamepass" && (
              <div className="space-y-3">
                {data?.gamepasses.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No gamepasses purchased by this customer.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {data?.gamepasses.map((gp) => {
                      const isActive = gp.redemptionStatus === "confirmed" && (gp.remainingMinutes ?? 0) > 0;
                      return (
                        <div key={gp.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{gp.packageName}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                isActive
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}>
                                {isActive ? "Active Pass" : gp.orderStatus}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Purchased: {new Date(gp.createdAt).toLocaleDateString()}
                              {gp.expiresAt ? ` · Expires: ${new Date(gp.expiresAt).toLocaleDateString()}` : ""}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-bold text-indigo-700 block text-sm">
                              {formatMins(gp.remainingMinutes)} left
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Paid {formatCurrency(parseFloat(gp.totalAmount).toFixed(2), currency)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: WALLET LEDGER */}
            {activeTab === "ledger" && (
              <div className="space-y-3">
                {data?.creditTransactions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No credit transactions recorded.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {data?.creditTransactions.map((tx) => {
                      const isCredit = tx.transactionType === "earned" || tx.transactionType === "bonus" || tx.transactionType === "refund" || tx.transactionType === "admin_adjust";
                      return (
                        <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                isCredit ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}>
                                {tx.transactionType}
                              </span>
                              <span className="text-slate-600 font-medium">{tx.description || "Wallet transaction"}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {new Date(tx.createdAt).toLocaleString()} · Balance after: {formatCurrency(parseFloat(tx.balanceAfter).toFixed(2), currency)}
                            </div>
                          </div>

                          <span className={`font-mono font-bold text-sm ${isCredit ? "text-emerald-700" : "text-rose-700"}`}>
                            {isCredit ? "+" : "-"}{formatCurrency(parseFloat(tx.amount).toFixed(2), currency)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
