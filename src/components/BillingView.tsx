import { formatCurrency, currencySymbol } from '../lib/currency';
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Receipt, TrendingUp, FileText, X, ShieldAlert, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { listBillingLedger, getBillingDetail, applyBillingOverride, getRevenueSummary } from "../api/billing";
import { ApiBillingEntry, ApiBillingOverride, ApiBillingRevenueSummary } from "../api/types";
import { listBeverageOrders, ApiBeverageOrder } from "../api/beverages";
import { Session } from "../types";

interface BillingViewProps {
  currency: string;
  sessions: Session[];
  onNotify: (message: string, severity: "info" | "success" | "danger" | "warning") => void;
}

export default function BillingView({ currency, sessions, onNotify }: BillingViewProps) {
  const { storeId, admin } = useAuth();
  const [beverageOrders, setBeverageOrders] = useState<ApiBeverageOrder[]>([]);
  const [ledger, setLedger] = useState<ApiBillingEntry[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const limit = 50;
  const [summary, setSummary] = useState<ApiBillingRevenueSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selected, setSelected] = useState<{ billing: ApiBillingEntry; overrides: ApiBillingOverride[] } | null>(null);

  // Date Filter State
  const [datePreset, setDatePreset] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const [overrideType, setOverrideType] = useState<"price" | "duration" | "both">("price");
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [overrideAmount, setOverrideAmount] = useState<string>("");
  const [overrideMinutes, setOverrideMinutes] = useState<string>("");

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
    if (!storeId) return;
    (async () => {
      try {
        const [paid, delivered] = await Promise.all([
          listBeverageOrders(storeId, "paid"),
          listBeverageOrders(storeId, "delivered"),
        ]);
        setBeverageOrders([...paid, ...delivered].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      } catch {
        setBeverageOrders([]);
      }
    })();
  }, [storeId]);

  const playerName = (b: ApiBillingEntry) =>
    b.userName || (b.userId ? `Player ${b.userId.slice(0, 6)}` : "Walk-in guest");

  useEffect(() => {
    refreshSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const allTimeTotals = useMemo(() => {
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

  const isDateInRange = (dateStr: string) => {
    if (datePreset === "all") return true;
    const d = new Date(dateStr);
    const now = new Date();
    if (datePreset === "today") {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    if (datePreset === "week") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= oneWeekAgo && d <= now;
    }
    if (datePreset === "month") {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      );
    }
    if (datePreset === "custom") {
      if (customStartDate && d < new Date(customStartDate)) return false;
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    }
    return true;
  };

  const filteredLedger = useMemo(() => {
    return ledger.filter((b) => isDateInRange(b.createdAt));
  }, [ledger, datePreset, customStartDate, customEndDate]);

  const dynamicTotals = useMemo(() => {
    if (datePreset === "all" && allTimeTotals) {
      return allTimeTotals;
    }
    return filteredLedger.reduce(
      (acc, b) => ({
        gross: acc.gross + parseFloat(b.grossAmount || "0"),
        discounts: acc.discounts + parseFloat(b.discountAmount || "0"),
        net: acc.net + parseFloat(b.netAmount || "0"),
        records: acc.records + 1,
      }),
      { gross: 0, discounts: 0, net: 0, records: 0 }
    );
  }, [filteredLedger, datePreset, allTimeTotals]);

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
      {/* Top Header Card with Custom Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Billing Ledger</h2>
          <p className="text-xs text-slate-400 mt-1">Immutable billing records generated from gaming sessions, with admin overrides.</p>
        </div>

        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "today", "week", "month", "custom"] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => setDatePreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                datePreset === preset
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {preset === "all" ? "All Time" : preset === "week" ? "This Week" : preset === "month" ? "This Month" : preset}
            </button>
          ))}
          {datePreset === "custom" && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700 font-mono"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700 font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* Revenue summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-precision">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono uppercase mb-2"><TrendingUp className="w-3.5 h-3.5" />Gross Revenue</div>
          <p className="text-xl font-bold text-slate-900 font-mono">{formatCurrency(dynamicTotals ? dynamicTotals.gross.toFixed(2) : "0.00", currency)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-precision">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono uppercase mb-2"><Receipt className="w-3.5 h-3.5" />Discounts</div>
          <p className="text-xl font-bold text-slate-900 font-mono">{formatCurrency(dynamicTotals ? dynamicTotals.discounts.toFixed(2) : "0.00", currency)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-precision">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono uppercase mb-2"><FileText className="w-3.5 h-3.5" />Net Revenue</div>
          <p className="text-xl font-bold text-emerald-700 font-mono">{formatCurrency(dynamicTotals ? dynamicTotals.net.toFixed(2) : "0.00", currency)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-precision">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono uppercase mb-2"><Receipt className="w-3.5 h-3.5" />Billed Records</div>
          <p className="text-xl font-bold text-slate-900 font-mono">{dynamicTotals ? dynamicTotals.records : 0}</p>
        </div>
      </div>

      {/* Ledger table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Player</th>
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
            {filteredLedger.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-slate-400">{loading ? "Loading…" : "No billing records match this date filter."}</td></tr>
            ) : (
              filteredLedger.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 cursor-pointer" onClick={() => openDetail(b.id)}>
                  <td className="px-4 py-3 font-mono text-slate-500">{new Date(b.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{playerName(b)}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{b.sessionId.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-slate-600">{b.billedMinutes}m</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{formatCurrency(parseFloat(b.grossAmount).toFixed(2), currency)}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{formatCurrency(parseFloat(b.discountAmount).toFixed(2), currency)}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{formatCurrency(parseFloat(b.netAmount).toFixed(2), currency)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${b.billingReason === 'upfront_initial' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : b.billingReason === 'extension_block' ? 'bg-purple-50 text-purple-700 border-purple-200' : b.billingReason === 'minute_settlement' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{b.billingReason === 'upfront_initial' ? 'Upfront (1st Hr)' : b.billingReason === 'extension_block' ? 'Extension Block' : b.billingReason === 'minute_settlement' ? 'Minute Settlement' : (b.billingReason || '').replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3 text-right"><span className="text-indigo-600 font-semibold">View</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
          <span>Page {page} of {totalPages} · {filteredLedger.length} of {total} records</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>

      {/* Override / detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Billing Record Detail</h3>
                <p className="text-[11px] text-slate-400 font-mono">{selected.billing.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><span className="text-slate-400 block text-[10px] uppercase font-mono">Player</span><span className="font-semibold text-slate-800">{playerName(selected.billing)}</span></div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><span className="text-slate-400 block text-[10px] uppercase font-mono">Session</span><span className="font-mono text-slate-800">{selected.billing.sessionId.slice(0, 8)}</span></div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><span className="text-slate-400 block text-[10px] uppercase font-mono">Gross Amount</span><span className="font-mono font-bold text-slate-800">{formatCurrency(parseFloat(selected.billing.grossAmount).toFixed(2), currency)}</span></div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><span className="text-slate-400 block text-[10px] uppercase font-mono">Discount</span><span className="font-mono text-slate-800">{formatCurrency(parseFloat(selected.billing.discountAmount).toFixed(2), currency)}</span></div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 col-span-2"><span className="text-slate-400 block text-[10px] uppercase font-mono">Net Billed</span><span className="font-mono text-lg font-bold text-emerald-700">{formatCurrency(parseFloat(selected.billing.netAmount).toFixed(2), currency)}</span></div>
            </div>

            {selected.overrides.length > 0 && (
              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50 space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Override History</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selected.overrides.map((o) => (
                    <div key={o.id} className="text-xs bg-white p-2 rounded border border-slate-200">
                      <div className="flex justify-between text-slate-500 text-[10px] font-mono">
                        <span>{new Date(o.createdAt).toLocaleString()}</span>
                        <span className="uppercase">{o.overrideType}</span>
                      </div>
                      <p className="text-slate-700 mt-1 font-medium">{o.reason}</p>
                      <p className="text-slate-400 text-[10px] font-mono mt-0.5">
                        Amount: {formatCurrency(parseFloat(o.oldAmount).toFixed(2), currency)} → {formatCurrency(parseFloat(o.newAmount).toFixed(2), currency)} · Minutes: {o.oldMinutes} → {o.newMinutes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Apply override form */}
            {(admin?.role === "super_admin" || admin?.role === "admin") && (
              <form onSubmit={handleOverrideSubmit} className="border-t border-slate-100 pt-3 space-y-3">
                <span className="text-xs font-bold text-slate-800 font-display flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-amber-500" /> Apply Override (Audit Logged)</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Type</label>
                    <select value={overrideType} onChange={(e) => setOverrideType(e.target.value as any)} className="w-full px-2 py-1.5 border border-slate-200 rounded bg-slate-50">
                      <option value="price">Price only</option>
                      <option value="duration">Duration only</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">New Amount</label>
                    <input type="number" step="0.01" value={overrideAmount} onChange={(e) => setOverrideAmount(e.target.value)} disabled={overrideType === "duration"} placeholder={selected.billing.netAmount} className="w-full px-2 py-1.5 border border-slate-200 rounded bg-slate-50 font-mono disabled:opacity-50" />
                  </div>
                </div>
                {overrideType !== "price" && (
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">New Minutes</label>
                    <input type="number" value={overrideMinutes} onChange={(e) => setOverrideMinutes(e.target.value)} placeholder={String(selected.billing.billedMinutes)} className="w-full px-2 py-1.5 border border-slate-200 rounded bg-slate-50 font-mono" />
                  </div>
                )}
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Reason (required)</label>
                  <input type="text" required value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="e.g. System crash / manager courtesy discount" className="w-full px-2 py-1.5 border border-slate-200 rounded bg-slate-50" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setSelected(null)} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 border border-slate-200 rounded">Cancel</button>
                  <button type="submit" disabled={!overrideReason.trim()} className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded disabled:opacity-40">Save Override</button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
