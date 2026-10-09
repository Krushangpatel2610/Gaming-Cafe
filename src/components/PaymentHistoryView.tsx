import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, RefreshCw, Search } from "lucide-react";
import { formatCurrency } from "../lib/currency";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { listPayments } from "../api/payments";
import { listTopupRequests } from "../api/credits";
import { listGamepassOrders } from "../api/gamepass";
import { ApiCustomer } from "../api/types";

interface PaymentHistoryViewProps {
  currency: string;
  customers: ApiCustomer[];
  onNotify: (message: string, severity: "info" | "success" | "danger" | "warning") => void;
}

type Kind = "topup" | "gamepass" | "payment";
type StatusGroup = "success" | "rejected" | "refunded" | "pending";

interface HistoryRow {
  key: string;
  kind: Kind;
  date: string;
  amount: number;
  method: string; // cash | upi | split | card | wallet | credits | ...
  cashAmount: number; // only meaningful for split gamepass orders
  upiAmount: number;
  status: string;
  statusGroup: StatusGroup;
  userId: string | null;
  detail: string;
  reason: string | null;
}

const PAGE_SIZE = 100; // per source, per fetch (server maximum)
const ROWS_PER_PAGE = 25;

const KIND_LABEL: Record<Kind, string> = {
  topup: "Wallet top-up",
  gamepass: "Gamepass",
  payment: "Counter payment",
};

const STATUS_STYLE: Record<StatusGroup, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-slate-100 text-slate-500 border-slate-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

function groupOf(status: string): StatusGroup {
  if (status === "confirmed" || status === "completed") return "success";
  if (status === "rejected" || status === "failed") return "rejected";
  if (status === "refunded") return "refunded";
  return "pending";
}

function money(n: number): string {
  return n.toFixed(2);
}

// How much of a row's amount was paid by each method (split orders carry both).
function parts(r: HistoryRow): { cash: number; upi: number; other: number } {
  if (r.method === "split") return { cash: r.cashAmount, upi: r.upiAmount, other: 0 };
  if (r.method === "cash") return { cash: r.amount, upi: 0, other: 0 };
  if (r.method === "upi") return { cash: 0, upi: r.amount, other: 0 };
  return { cash: 0, upi: 0, other: r.amount };
}

export default function PaymentHistoryView({ currency, customers, onNotify }: PaymentHistoryViewProps) {
  const { storeId } = useAuth();

  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [fetchedPages, setFetchedPages] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const [kindFilter, setKindFilter] = useState<Kind | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusGroup | "all">("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const fetchPage = useCallback(
    async (pageNo: number): Promise<{ rows: HistoryRow[]; more: boolean }> => {
      if (!storeId) return { rows: [], more: false };
      const [topConfirmed, topRejected, gpConfirmed, gpRejected, pays] = await Promise.all([
        listTopupRequests(storeId, { status: "confirmed", page: pageNo, limit: PAGE_SIZE }),
        listTopupRequests(storeId, { status: "rejected", page: pageNo, limit: PAGE_SIZE }),
        listGamepassOrders(storeId, { status: "confirmed", page: pageNo, limit: PAGE_SIZE }),
        listGamepassOrders(storeId, { status: "rejected", page: pageNo, limit: PAGE_SIZE }),
        listPayments(storeId, { page: pageNo, limit: PAGE_SIZE }),
      ]);

      const out: HistoryRow[] = [];

      for (const r of [...topConfirmed.data, ...topRejected.data]) {
        const method = r.paymentMethod ?? "upi";
        out.push({
          key: `topup-${r.id}`,
          kind: "topup",
          date: r.reviewedAt ?? r.createdAt,
          amount: parseFloat(r.amount),
          method,
          cashAmount: 0,
          upiAmount: 0,
          status: r.status,
          statusGroup: groupOf(r.status),
          userId: r.userId,
          detail: r.utrReference
            ? `UTR ${r.utrReference}`
            : r.splitGroupId
              ? "Part of a split payment"
              : "Wallet top-up",
          reason: r.rejectionReason,
        });
      }

      for (const o of [...gpConfirmed.data, ...gpRejected.data]) {
        const counts = new Map<string, number>();
        for (const it of o.items) counts.set(it.packageName, (counts.get(it.packageName) ?? 0) + 1);
        const summary = [...counts.entries()].map(([name, n]) => `${n}× ${name}`).join(", ");
        const cash = parseFloat(o.cashAmount ?? "0");
        const upi = parseFloat(o.upiAmount ?? "0");
        out.push({
          key: `gamepass-${o.id}`,
          kind: "gamepass",
          date: o.reviewedAt ?? o.createdAt,
          amount: parseFloat(o.totalAmount),
          method: o.paymentMethod,
          cashAmount: cash,
          upiAmount: upi,
          status: o.status,
          statusGroup: groupOf(o.status),
          userId: o.userId,
          detail:
            o.paymentMethod === "split"
              ? `${summary || "Gamepass order"} · Cash ${money(cash)} + UPI ${money(upi)}`
              : summary || "Gamepass order",
          reason: o.rejectionReason,
        });
      }

      for (const p of pays.data) {
        out.push({
          key: `payment-${p.id}`,
          kind: "payment",
          date: p.paidAt ?? p.createdAt,
          amount: parseFloat(p.amount),
          method: p.method,
          cashAmount: 0,
          upiAmount: 0,
          status: p.status,
          statusGroup: groupOf(p.status),
          userId: p.userId,
          detail: p.notes || (p.transactionRef ? `Ref ${p.transactionRef}` : "Recorded payment"),
          reason: null,
        });
      }

      const more = [topConfirmed, topRejected, gpConfirmed, gpRejected, pays].some(
        (res) => res.data.length >= PAGE_SIZE
      );
      return { rows: out, more };
    },
    [storeId]
  );

  const loadFirst = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await fetchPage(1);
      setRows(res.rows);
      setHasMore(res.more);
      setFetchedPages(1);
      setPage(1);
    } catch (err) {
      onNotify(`Failed to load payment history: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    } finally {
      setLoading(false);
    }
  }, [storeId, fetchPage, onNotify]);

  const loadOlder = async () => {
    setLoadingMore(true);
    try {
      const res = await fetchPage(fetchedPages + 1);
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.key));
        return [...prev, ...res.rows.filter((r) => !seen.has(r.key))];
      });
      setHasMore(res.more);
      setFetchedPages((n) => n + 1);
    } catch (err) {
      onNotify(`Failed to load older payments: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  useEffect(() => {
    setPage(1);
  }, [kindFilter, statusFilter, methodFilter, dateFrom, dateTo, search]);

  const customerName = useCallback(
    (userId: string | null): string => {
      if (!userId) return "—";
      const c = customers.find((x) => x.userId === userId);
      return c?.name || c?.phone || c?.email || userId.slice(0, 8);
    },
    [customers]
  );

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    const q = search.trim().toLowerCase();

    return rows
      .filter((r) => {
        if (kindFilter !== "all" && r.kind !== kindFilter) return false;
        if (statusFilter !== "all" && r.statusGroup !== statusFilter) return false;
        if (methodFilter !== "all") {
          if (methodFilter === "other") {
            if (["cash", "upi", "split"].includes(r.method)) return false;
          } else if (r.method !== methodFilter) return false;
        }
        const t = new Date(r.date).getTime();
        if (from !== null && t < from) return false;
        if (to !== null && t > to) return false;
        if (q) {
          const c = r.userId ? customers.find((x) => x.userId === r.userId) : undefined;
          const hay = [c?.name, c?.phone, c?.email, r.userId, r.detail, r.reason, r.method]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [rows, kindFilter, statusFilter, methodFilter, dateFrom, dateTo, search, customers]);

  const totals = useMemo(() => {
    let cash = 0;
    let upi = 0;
    let other = 0;
    let count = 0;
    for (const r of filtered) {
      if (r.statusGroup !== "success") continue;
      const p = parts(r);
      cash += p.cash;
      upi += p.upi;
      other += p.other;
      count += 1;
    }
    return { cash, upi, other, total: cash + upi + other, count };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageRows = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = ["Date", "Type", "Customer", "Details", "Method", "Cash", "UPI", "Amount", "Status", "Reason"];
    const lines = filtered.map((r) => {
      const p = parts(r);
      return [
        new Date(r.date).toLocaleString(),
        KIND_LABEL[r.kind],
        customerName(r.userId),
        r.detail,
        r.method,
        money(p.cash),
        money(p.upi),
        money(r.amount),
        r.status,
        r.reason ?? "",
      ]
        .map((v) => esc(String(v)))
        .join(",");
    });
    const blob = new Blob([[header.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
      active
        ? "bg-indigo-600 text-white border-indigo-600"
        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
    }`;

  return (
    <div className="space-y-4">
      {/* Summary of what is currently filtered */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total received", value: totals.total, tone: "text-slate-900" },
          { label: "Cash", value: totals.cash, tone: "text-emerald-700" },
          { label: "UPI", value: totals.upi, tone: "text-indigo-700" },
          { label: "Other methods", value: totals.other, tone: "text-slate-600" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 shadow-precision p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">{c.label}</p>
            <p className={`text-lg font-bold font-mono mt-1 ${c.tone}`}>{formatCurrency(money(c.value), currency)}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-400">
        Totals count only successful payments in the current filter ({totals.count} of {filtered.length} shown).
      </p>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-precision p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button className={chip(kindFilter === "all")} onClick={() => setKindFilter("all")}>All</button>
          <button className={chip(kindFilter === "topup")} onClick={() => setKindFilter("topup")}>Wallet top-ups</button>
          <button className={chip(kindFilter === "gamepass")} onClick={() => setKindFilter("gamepass")}>Gamepass</button>
          <button className={chip(kindFilter === "payment")} onClick={() => setKindFilter("payment")}>Counter payments</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusGroup | "all")}
            className="px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="success">Successful</option>
            <option value="rejected">Rejected / failed</option>
            <option value="refunded">Refunded</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none"
          >
            <option value="all">All methods</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="split">Split (Cash + UPI)</option>
            <option value="other">Other</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none"
            aria-label="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none"
            aria-label="To date"
          />
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Customer, UTR, notes…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setKindFilter("all");
              setStatusFilter("all");
              setMethodFilter("all");
              setDateFrom("");
              setDateTo("");
              setSearch("");
            }}
            className="text-xs text-slate-500 hover:text-slate-800 underline"
          >
            Clear filters
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={loadFirst}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading payment history…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Details</th>
                  <th className="text-left px-4 py-3">Method</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No payments match these filters.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r) => (
                    <tr key={r.key} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(r.date).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{KIND_LABEL[r.kind]}</td>
                      <td className="px-4 py-3 text-slate-700">{customerName(r.userId)}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[260px] truncate" title={r.detail}>
                        {r.detail}
                      </td>
                      <td className="px-4 py-3 uppercase text-slate-600 font-semibold">{r.method}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(money(r.amount), currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border font-bold ${STATUS_STYLE[r.statusGroup]}`}>
                          {r.status}
                        </span>
                        {r.reason && (
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] truncate" title={r.reason}>
                            {r.reason}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
          <span>
            Page {page} of {totalPages} · {filtered.length} entries
          </span>
          <div className="flex items-center gap-2">
            {hasMore && (
              <button
                onClick={loadOlder}
                disabled={loadingMore}
                className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40 flex items-center gap-1"
              >
                {loadingMore && <Loader2 className="w-3 h-3 animate-spin" />}
                Load older
              </button>
            )}
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
