import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ShieldQuestion, X, Eye, Gavel } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { listDisputes, startDisputeReview, resolveDispute, ResolveDisputeBody } from "../api/disputes";
import { ApiCustomer, ApiDispute, ApiDisputeResolution, ApiDisputeStatus } from "../api/types";

interface DisputesViewProps {
  customers: ApiCustomer[];
  onNotify: (message: string, severity: "info" | "success" | "danger" | "warning") => void;
}

const STATUS_BADGE: Record<ApiDisputeStatus, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  under_review: "bg-indigo-50 text-indigo-700 border-indigo-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  withdrawn: "bg-slate-100 text-slate-500 border-slate-200",
};

const RESOLUTIONS: ApiDisputeResolution[] = ["upheld", "partial_refund", "full_refund", "credit_issued"];

export default function DisputesView({ customers, onNotify }: DisputesViewProps) {
  const { storeId, admin } = useAuth();
  const [disputes, setDisputes] = useState<ApiDispute[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selected, setSelected] = useState<ApiDispute | null>(null);
  const [resolution, setResolution] = useState<ApiDisputeResolution>("upheld");
  const [resolutionAmount, setResolutionAmount] = useState<string>("");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");

  const canResolve = admin?.role === "super_admin" || admin?.role === "admin";

  const refresh = async () => {
    if (!storeId) return;
    try {
      const { data } = await listDisputes(storeId, { limit: 100, status: statusFilter === "All" ? undefined : (statusFilter as ApiDisputeStatus) });
      setDisputes(data);
    } catch (err) {
      onNotify(`Failed to load disputes: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, statusFilter]);

  const handleReview = async (d: ApiDispute) => {
    if (!storeId) return;
    try {
      await startDisputeReview(storeId, d.id);
      onNotify("Dispute moved to review.", "info");
      await refresh();
    } catch (err) {
      onNotify(`Failed to start review: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !selected) return;
    const body: ResolveDisputeBody = {
      resolution,
      resolutionAmount: resolutionAmount ? parseFloat(resolutionAmount) : undefined,
      resolutionNotes: resolutionNotes || undefined,
    };
    try {
      await resolveDispute(storeId, selected.id, body);
      onNotify("Dispute resolved.", "success");
      setSelected(null);
      setResolutionAmount("");
      setResolutionNotes("");
      await refresh();
    } catch (err) {
      onNotify(`Failed to resolve dispute: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Billing Disputes</h2>
          <p className="text-xs text-slate-400 mt-1">Customer-filed billing disputes — review, then resolve with a decision.</p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none">
          <option value="All">All Statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {disputes.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">No disputes match this filter.</div>
        ) : (
          disputes.map((d) => {
            const cust = d.userId ? customers.find((c) => c.userId === d.userId) : undefined;
            return (
              <div key={d.id} className="bg-white rounded-xl border border-slate-200 shadow-precision p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldQuestion className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800">{cust?.name || "Unknown customer"}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[d.status]}`}>{d.status.replace("_", " ")}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-3">{d.reason}</p>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                  <span>Disputed: ₹{parseFloat(d.disputeAmount).toFixed(2)}</span>
                  <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
                {d.status === "resolved" && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-[11px] text-emerald-800">
                    Resolved: {d.resolution?.replace("_", " ")} {d.resolutionAmount && `(₹${parseFloat(d.resolutionAmount).toFixed(2)})`}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  {d.status === "open" && canResolve && (
                    <button onClick={() => handleReview(d)} className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"><Eye className="w-3.5 h-3.5" />Start Review</button>
                  )}
                  {(d.status === "open" || d.status === "under_review") && canResolve && (
                    <button onClick={() => setSelected(d)} className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"><Gavel className="w-3.5 h-3.5" />Resolve</button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Resolve */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Resolve Dispute</h3>
                <p className="text-xs text-slate-400 mt-1">Disputed amount: ₹{parseFloat(selected.disputeAmount).toFixed(2)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleResolveSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  {RESOLUTIONS.map((r) => (
                    <button key={r} type="button" onClick={() => setResolution(r)} className={`py-2 text-[11px] font-bold rounded-lg border capitalize ${resolution === r ? "bg-indigo-600 border-indigo-700 text-white" : "bg-slate-50 border-slate-200 text-slate-600"}`}>{r.replace("_", " ")}</button>
                  ))}
                </div>
              </div>
              {resolution !== "upheld" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Amount (₹, optional — full disputed amount if blank)</label>
                  <input type="number" step="0.01" max={selected.disputeAmount} value={resolutionAmount} onChange={(e) => setResolutionAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Notes (optional)</label>
                <textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" />
              </div>
              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setSelected(null)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10">Submit Decision</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
