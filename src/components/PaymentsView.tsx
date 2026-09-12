import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { QrCode, Plus, X, Undo2, Wallet, Clock, Check, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { listPayments, recordPayment, refundPayment, RecordPaymentBody } from "../api/payments";
import { getPaymentQr } from "../api/stores";
import { listTopupRequests, confirmTopupRequest, rejectTopupRequest, ApiTopupRequest } from "../api/credits";
import { ApiCustomer, ApiPayment, ApiPaymentMethod, ApiPaymentQr } from "../api/types";

interface PaymentsViewProps {
  customers: ApiCustomer[];
  onNotify: (message: string, severity: "info" | "success" | "danger" | "warning") => void;
}

const METHODS: ApiPaymentMethod[] = ["cash", "card", "upi", "wallet", "credits"];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function PaymentsView({ customers, onNotify }: PaymentsViewProps) {
  const { storeId, admin } = useAuth();
  const [qr, setQr] = useState<ApiPaymentQr | null>(null);
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const limit = 20;
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showRecordModal, setShowRecordModal] = useState<boolean>(false);
  const [refundTarget, setRefundTarget] = useState<ApiPayment | null>(null);
  const [refundReason, setRefundReason] = useState<string>("");
  const [refundAmount, setRefundAmount] = useState<string>("");

  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<ApiPaymentMethod>("upi");
  const [userId, setUserId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [topupRequests, setTopupRequests] = useState<ApiTopupRequest[]>([]);
  const [rejectTarget, setRejectTarget] = useState<ApiTopupRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const canRecord = admin?.role === "super_admin" || admin?.role === "admin";
  const canRefund = admin?.role === "super_admin";
  const canReviewTopups = admin?.role === "super_admin" || admin?.role === "admin";

  const refreshTopupRequests = async () => {
    if (!storeId) return;
    try {
      const { data } = await listTopupRequests(storeId, { status: "pending", limit: 50 });
      setTopupRequests(data);
    } catch (err) {
      onNotify(`Failed to load top-up requests: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const refreshQr = async () => {
    if (!storeId) return;
    try {
      setQr(await getPaymentQr(storeId));
    } catch (err) {
      onNotify(`Failed to load payment QR: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const refreshPayments = async () => {
    if (!storeId) return;
    try {
      const { data, meta } = await listPayments(storeId, { page, limit });
      setPayments(data);
      setTotal(meta?.total ?? data.length);
    } catch (err) {
      onNotify(`Failed to load payments: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  useEffect(() => {
    refreshQr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => {
    refreshPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, page]);

  useEffect(() => {
    refreshTopupRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleConfirmTopup = async (req: ApiTopupRequest) => {
    if (!storeId) return;
    setProcessingId(req.id);
    try {
      await confirmTopupRequest(storeId, req.id);
      onNotify(`Confirmed ₹${parseFloat(req.amount).toFixed(2)} top-up — credits granted.`, "success");
      await refreshTopupRequests();
    } catch (err) {
      onNotify(`Failed to confirm top-up: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !rejectTarget) return;
    setProcessingId(rejectTarget.id);
    try {
      await rejectTopupRequest(storeId, rejectTarget.id, rejectReason);
      onNotify("Top-up request rejected.", "info");
      setRejectTarget(null);
      setRejectReason("");
      await refreshTopupRequests();
    } catch (err) {
      onNotify(`Failed to reject top-up: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !amount) return;
    const body: RecordPaymentBody = {
      amount: parseFloat(amount),
      method,
      userId: userId || undefined,
      notes: notes || undefined,
    };
    try {
      await recordPayment(storeId, body);
      onNotify("Payment recorded.", "success");
      setShowRecordModal(false);
      setAmount("");
      setUserId("");
      setNotes("");
      setMethod("upi");
      await refreshPayments();
    } catch (err) {
      onNotify(`Failed to record payment: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !refundTarget) return;
    try {
      await refundPayment(storeId, refundTarget.id, {
        amount: refundAmount ? parseFloat(refundAmount) : undefined,
        reason: refundReason,
      });
      onNotify("Payment refunded.", "success");
      setRefundTarget(null);
      setRefundReason("");
      setRefundAmount("");
      await refreshPayments();
    } catch (err) {
      onNotify(`Failed to refund payment: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Payments</h2>
          <p className="text-xs text-slate-400 mt-1">
            Customers pay directly via your UPI QR — no gateway, no fees. Staff record each payment manually after collecting it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowQrModal(true)} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <QrCode className="w-4 h-4" />
            <span>Show QR</span>
          </button>
          {canRecord && (
            <button onClick={() => setShowRecordModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Pending wallet top-up requests — player-submitted, needs staff confirm/reject */}
      {canReviewTopups && topupRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-precision overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">Pending Wallet Top-Ups ({topupRequests.length})</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {topupRequests.map((req) => {
              const cust = customers.find((c) => c.userId === req.userId);
              return (
                <div key={req.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-slate-900 text-sm">₹{parseFloat(req.amount).toFixed(2)}</p>
                      <span className="text-xs text-slate-500">{cust?.name || cust?.phone || req.userId.slice(0, 8)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {new Date(req.createdAt).toLocaleString()}
                      {req.utrReference && <> · UTR: {req.utrReference}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleConfirmTopup(req)}
                      disabled={processingId === req.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Confirm
                    </button>
                    <button
                      onClick={() => setRejectTarget(req)}
                      disabled={processingId === req.id}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payments table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Method</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {payments.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-400">No payments recorded yet.</td></tr>
            ) : (
              payments.map((p) => {
                const cust = p.userId ? customers.find((c) => c.userId === p.userId) : undefined;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-slate-500">{new Date(p.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">₹{parseFloat(p.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 uppercase text-slate-600 font-semibold">{p.method}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full border font-bold ${STATUS_BADGE[p.status]}`}>{p.status}</span></td>
                    <td className="px-4 py-3 text-slate-600">{cust?.name || (p.userId ? p.userId.slice(0, 8) : "—")}</td>
                    <td className="px-4 py-3 text-slate-400 truncate max-w-[160px]">{p.notes || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {canRefund && p.status === "completed" && (
                        <button onClick={() => setRefundTarget(p)} className="text-red-600 font-semibold flex items-center gap-1 ml-auto">
                          <Undo2 className="w-3.5 h-3.5" />Refund
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
          <span>Page {page} of {totalPages} · {total} payments</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {/* MODAL: Show QR to customer */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Scan to Pay</h3>
                <p className="text-xs text-slate-400 mt-1">Show this to the customer at checkout.</p>
              </div>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              {qr?.upiQrImage ? (
                <img src={qr.upiQrImage} alt="UPI QR code" className="w-56 h-56 object-contain rounded-lg border border-slate-200" />
              ) : (
                <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 text-slate-400 text-center px-4">
                  <QrCode className="w-8 h-8" />
                  <p className="text-xs">No QR uploaded yet. {admin?.role === "super_admin" ? "Upload one from Settings." : "Ask a super admin to upload one from Settings."}</p>
                </div>
              )}
              {qr?.upiId && <p className="text-xs font-mono text-slate-600">{qr.upiId}</p>}
              <p className="text-[11px] text-slate-400 text-center">After the customer pays, record it below so it appears in the ledger.</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: Record Payment */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">Record Payment</h3>
              <p className="text-xs text-slate-400 mt-1">Log a payment the customer already made directly to you.</p>
            </div>
            <form onSubmit={handleRecordSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Amount (₹)</label>
                <input required type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Method</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {METHODS.map((m) => (
                    <button key={m} type="button" onClick={() => setMethod(m)} className={`py-1.5 text-[10px] font-bold rounded-lg border uppercase ${method === m ? "bg-indigo-600 border-indigo-700 text-white" : "bg-slate-50 border-slate-200 text-slate-600"}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Customer (optional)</label>
                <select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none">
                  <option value="">-- Not linked to a member --</option>
                  {customers.map((c) => (
                    <option key={c.userId} value={c.userId}>{c.name || c.phone || c.userId.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Notes (optional)</label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none" placeholder="e.g. Table 4, booking ref" />
              </div>
              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowRecordModal(false)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-1.5">
                  <Wallet className="w-4 h-4" /><span>Record</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Refund */}
      {refundTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 font-display">Refund Payment</h3>
              <p className="text-xs text-slate-400 mt-1">₹{parseFloat(refundTarget.amount).toFixed(2)} via {refundTarget.method.toUpperCase()}</p>
            </div>
            <form onSubmit={handleRefundSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Refund amount (optional — full if blank)</label>
                <input type="number" step="0.01" min="0.01" max={refundTarget.amount} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Reason</label>
                <textarea required minLength={5} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" />
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setRefundTarget(null)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-lg">Confirm Refund</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Reject top-up request */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 font-display">Reject Top-Up Request</h3>
              <p className="text-xs text-slate-400 mt-1">₹{parseFloat(rejectTarget.amount).toFixed(2)} request will be marked rejected — no credits granted.</p>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Reason</label>
                <textarea required minLength={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" placeholder="e.g. Payment not received" />
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setRejectTarget(null)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-lg">Confirm Reject</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
