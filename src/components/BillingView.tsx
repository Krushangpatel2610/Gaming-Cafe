import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Receipt, TrendingUp, FileText, X, ShieldAlert, ReceiptText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { listBillingLedger, getBillingDetail, generateBill, applyBillingOverride, getRevenueSummary } from "../api/billing";
import { ApiBillingEntry, ApiBillingOverride, ApiBillingRevenueSummary } from "../api/types";
import { Session } from "../types";

interface BillingViewProps {
  sessions: Session[];
  onNotify: (message: string, severity: "info" | "success" | "danger" | "warning") => void;
}

export default function BillingView({ sessions, onNotify }: BillingViewProps) {
  const { storeId, admin } = useAuth();
  const [ledger, setLedger] = useState<ApiBillingEntry[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const limit = 20;
  const [summary, setSummary] = useState<ApiBillingRevenueSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selected, setSelected] = useState<{ billing: ApiBillingEntry; overrides: ApiBillingOverride[] } | null>(null);
  const [genSessionId, setGenSessionId] = useState<string>("");

  const [overrideType, setOverrideType] = useState<"price" | "duration" | "both">("price");
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [overrideAmount, setOverrideAmount] = useState<string>("");
  const [overrideMinutes, setOverrideMinutes] = useState<string>("");

  const unbilledSessions = useMemo(() => sessions.filter((s) => s.status === "Completed" && s.paymentStatus === "Unpaid"), [sessions]);

  const refreshLedger = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const { data, meta } = await listBillingLedger(storeId, { page, limit });
      setLedger(data);
      setTotal(meta?.total ?? data.length);
    } catch (err) {
      onNotify(`Failed to load billing ledger: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    } finally {
      setLoading(false);
    }
  };

  const refreshSummary = async () => {
    if (!storeId) return;
    try {
      setSummary(await getRevenueSummary(storeId, { groupBy: "day" }));
    } catch (err) {
      onNotify(`Failed to load revenue summary: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  useEffect(() => {
    refreshLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, page]);

  useEffect(() => {
    refreshSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const totals = useMemo(() => {
    if (!summary) return null;
    return summary.summary.reduce(
      (acc, row) => ({
        gross: acc.gross + parseFloat(row.totalGross),
        discounts: acc.discounts + parseFloat(row.totalDiscounts),
        net: acc.net + parseFloat(row.totalNet),
        records: acc.records + row.totalRecords,
      }),
      { gross: 0, discounts: 0, net: 0, records: 0 }
    );
  }, [summary]);

  const openDetail = async (billingId: string) => {
    if (!storeId) return;
    try {
      setSelected(await getBillingDetail(storeId, billingId));
      setOverrideReason("");
      setOverrideAmount("");
      setOverrideMinutes("");
    } catch (err) {
      onNotify(`Failed to load billing detail: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const handleGenerateBill = async () => {
    if (!storeId || !genSessionId) return;
    try {
      await generateBill(storeId, genSessionId);
      onNotify("Bill generated for session.", "success");
      setGenSessionId("");
      await refreshLedger();
    } catch (err) {
      onNotify(`Failed to generate bill: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !selected) return;
    try {
      const result = await applyBillingOverride(storeId, selected.billing.id, {
        overrideType,
        reason: overrideReason,
        newAmount: overrideAmount ? parseFloat(overrideAmount) : undefined,
        newMinutes: overrideMinutes ? parseInt(overrideMinutes, 10) : undefined,
      });
      onNotify("Override applied.", "success");
      setSelected({ billing: result.billing, overrides: [...selected.overrides, result.override] });
      setOverrideReason("");
      setOverrideAmount("");
      setOverrideMinutes("");
      await refreshLedger();
    } catch (err) {
      onNotify(`Failed to apply override: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Billing Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">Immutable billing records generated from completed sessions, with admin overrides.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={genSessionId} onChange={(e) => setGenSessionId(e.target.value)} className="px-3 py-2 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none">
            <option value="">-- Select unbilled session --</option>
            {unbilledSessions.map((s) => (
              <option key={s.id} value={s.id}>{s.pcName} · {s.customerName} · {new Date(s.startTime).toLocaleString()}</option>
            ))}
          </select>
          <button
            disabled={!genSessionId}
            onClick={handleGenerateBill}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 flex items-center gap-1.5"
          >
            <ReceiptText className="w-4 h-4" />
            <span>Generate Bill</span>
          </button>
        </div>
      </div>

      {/* Revenue summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-precision">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono uppercase mb-2"><TrendingUp className="w-3.5 h-3.5" />Gross Revenue</div>
          <p className="text-xl font-bold text-slate-900 font-mono">₹{totals ? totals.gross.toFixed(2) : "0.00"}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-precision">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono uppercase mb-2"><Receipt className="w-3.5 h-3.5" />Discounts</div>
          <p className="text-xl font-bold text-slate-900 font-mono">₹{totals ? totals.discounts.toFixed(2) : "0.00"}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-precision">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono uppercase mb-2"><FileText className="w-3.5 h-3.5" />Net Revenue</div>
          <p className="text-xl font-bold text-emerald-700 font-mono">₹{totals ? totals.net.toFixed(2) : "0.00"}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-precision">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono uppercase mb-2"><Receipt className="w-3.5 h-3.5" />Billed Records</div>
          <p className="text-xl font-bold text-slate-900 font-mono">{totals ? totals.records : 0}</p>
        </div>
      </div>

      {/* Ledger table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Session</th>
              <th className="text-left px-4 py-3">Minutes</th>
              <th className="text-left px-4 py-3">Gross</th>
              <th className="text-left px-4 py-3">Discount</th>
              <th className="text-left px-4 py-3">Net</th>
              <th className="text-left px-4 py-3">Reason</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {ledger.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-400">{loading ? "Loading…" : "No billing records yet."}</td></tr>
            ) : (
              ledger.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 cursor-pointer" onClick={() => openDetail(b.id)}>
                  <td className="px-4 py-3 font-mono text-slate-500">{new Date(b.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{b.sessionId.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-slate-600">{b.billedMinutes}m</td>
                  <td className="px-4 py-3 font-mono text-slate-600">₹{parseFloat(b.grossAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">₹{parseFloat(b.discountAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">₹{parseFloat(b.netAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-500">{b.billingReason}</td>
                  <td className="px-4 py-3 text-right"><span className="text-indigo-600 font-semibold">View</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
          <span>Page {page} of {totalPages} · {total} records</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {/* MODAL: Billing detail + override */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between sticky top-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Billing Record</h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">{selected.billing.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-slate-400 block">Billed window</span><span className="font-mono text-slate-700">{new Date(selected.billing.billedFrom).toLocaleTimeString()} – {new Date(selected.billing.billedUntil).toLocaleTimeString()}</span></div>
                <div><span className="text-slate-400 block">Minutes</span><span className="font-semibold text-slate-700">{selected.billing.billedMinutes}m</span></div>
                <div><span className="text-slate-400 block">Base rate</span><span className="font-mono text-slate-700">₹{parseFloat(selected.billing.baseRate).toFixed(2)}/hr</span></div>
                <div><span className="text-slate-400 block">Multiplier</span><span className="font-mono text-slate-700">×{selected.billing.appliedMultiplier}</span></div>
                <div><span className="text-slate-400 block">Gross</span><span className="font-mono text-slate-700">₹{parseFloat(selected.billing.grossAmount).toFixed(2)}</span></div>
                <div><span className="text-slate-400 block">Discount</span><span className="font-mono text-slate-700">₹{parseFloat(selected.billing.discountAmount).toFixed(2)}</span></div>
                <div className="col-span-2 pt-1 border-t border-slate-100"><span className="text-slate-400 block">Net Amount</span><span className="font-mono text-lg font-bold text-slate-900">₹{parseFloat(selected.billing.netAmount).toFixed(2)}</span></div>
              </div>

              {selected.overrides.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Overrides</p>
                  {selected.overrides.map((o) => (
                    <div key={o.id} className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-[11px]">
                      <p className="font-bold text-amber-800">{o.overrideType}: {o.originalValue} → {o.overrideValue}</p>
                      <p className="text-amber-700 mt-0.5">{o.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              {admin?.role === "super_admin" && (
                <form onSubmit={handleOverrideSubmit} className="pt-3 border-t border-slate-100 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono flex items-center gap-1"><ShieldAlert className="w-3 h-3" />New Override (super admin)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["price", "duration", "both"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setOverrideType(t)} className={`py-1.5 text-[11px] font-bold rounded-lg border capitalize ${overrideType === t ? "bg-indigo-600 border-indigo-700 text-white" : "bg-slate-50 border-slate-200 text-slate-600"}`}>{t}</button>
                    ))}
                  </div>
                  {(overrideType === "price" || overrideType === "both") && (
                    <input type="number" step="0.01" placeholder="New amount (₹)" value={overrideAmount} onChange={(e) => setOverrideAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" />
                  )}
                  {(overrideType === "duration" || overrideType === "both") && (
                    <input type="number" placeholder="New minutes" value={overrideMinutes} onChange={(e) => setOverrideMinutes(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" />
                  )}
                  <textarea required minLength={10} placeholder="Reason (min 10 characters)" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" rows={2} />
                  <button type="submit" className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold">Apply Override</button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
