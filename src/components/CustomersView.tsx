import { formatCurrency, currencySymbol } from '../lib/currency';
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Users,
  Plus,
  Search,
  Filter,
  DollarSign,
  Clock,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  ShieldAlert,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2
} from "lucide-react";
import { ApiCustomer, ApiSuspensionAppeal } from "../api/types";
import { listSuspensionAppeals, resolveSuspensionAppeal } from "../api/customers";

interface CustomersViewProps {
  currency: string;
  customers: ApiCustomer[];
  storeId?: string;
  onRegisterCustomer: (name: string, phone?: string) => void;
  onAddBalance: (userId: string, amount: number) => void;
  onToggleStatus: (userId: string, reason?: string) => void;
  onRefreshCustomers?: () => void;
}

export default function CustomersView({
  currency,
  customers,
  storeId,
  onRegisterCustomer,
  onAddBalance,
  onToggleStatus,
  onRefreshCustomers,
}: CustomersViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"directory" | "appeals">("directory");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [textSearch, setTextSearch] = useState<string>("");

  // Appeals state
  const [appeals, setAppeals] = useState<ApiSuspensionAppeal[]>([]);
  const [loadingAppeals, setLoadingAppeals] = useState<boolean>(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [appealFeedback, setAppealFeedback] = useState<string | null>(null);

  // Modal states
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [topUpCustId, setTopUpCustId] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<number>(20);

  // Form states for register
  const [regName, setRegName] = useState<string>("");
  const [regPhone, setRegPhone] = useState<string>("");

  const loadAppeals = useCallback(async () => {
    if (!storeId) return;
    setLoadingAppeals(true);
    try {
      const data = await listSuspensionAppeals(storeId);
      setAppeals(data);
    } catch {
      // Non-fatal
    } finally {
      setLoadingAppeals(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (activeSubTab === "appeals") {
      loadAppeals();
    }
  }, [activeSubTab, loadAppeals]);

  const handleResolveAppeal = async (appealId: string, decision: "approved" | "rejected") => {
    if (!storeId) return;
    let responseText: string | undefined = undefined;
    if (decision === "rejected") {
      const promptVal = window.prompt("Reason for rejecting this appeal (optional):");
      if (promptVal === null) return; // cancelled
      responseText = promptVal || undefined;
    }
    setResolvingId(appealId);
    try {
      await resolveSuspensionAppeal(storeId, appealId, decision, responseText);
      setAppealFeedback(`Appeal ${decision === "approved" ? "approved — customer unsuspended" : "rejected"}.`);
      setTimeout(() => setAppealFeedback(null), 4000);
      await loadAppeals();
      onRefreshCustomers?.();
    } catch (err: any) {
      alert(err?.message || "Failed to resolve appeal");
    } finally {
      setResolvingId(null);
    }
  };

  const pendingAppealsCount = appeals.filter(a => a.appealStatus === "pending").length;

  const filteredCustomers = customers.filter(c => {
    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Active" && !c.isSuspended) ||
      (selectedStatus === "Suspended" && c.isSuspended);
    const haystack = `${c.name || ""} ${c.email || ""} ${c.phone || ""}`.toLowerCase();
    const matchesText = haystack.includes(textSearch.toLowerCase());
    return matchesStatus && matchesText;
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegisterCustomer(regName, regPhone || undefined);
    setShowRegisterModal(false);
    setRegName("");
    setRegPhone("");
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpCustId) return;
    onAddBalance(topUpCustId, topUpAmount);
    setTopUpCustId(null);
    setTopUpAmount(20);
  };

  const handleToggleClick = (cust: ApiCustomer) => {
    if (cust.isSuspended) {
      onToggleStatus(cust.userId);
      return;
    }
    const reason = window.prompt(`Reason for suspending ${cust.name || "this customer"} (visible in their record):`);
    if (reason === null) return; // cancelled
    onToggleStatus(cust.userId, reason || undefined);
  };

  const formatPlayTime = (minutes: number) => {
    const hrs = minutes / 60;
    return hrs >= 1 ? `${hrs.toFixed(1)} hrs` : `${minutes} min`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Customer Directory & Wallets</h2>
          <p className="text-xs text-slate-400 mt-1">
            Register new players, top up real wallet balances, and manage store-level suspensions and customer appeals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all flex items-center space-x-1.5 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register Customer</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs: Directory vs Appeals */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab("directory")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeSubTab === "directory"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customer Directory</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeSubTab === "directory" ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {customers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("appeals")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeSubTab === "appeals"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Suspension Appeals</span>
            {pendingAppealsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold animate-pulse">
                {pendingAppealsCount}
              </span>
            )}
          </button>
        </div>

        {activeSubTab === "appeals" && (
          <button
            onClick={loadAppeals}
            disabled={loadingAppeals}
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg text-xs flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAppeals ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {appealFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{appealFeedback}</span>
        </div>
      )}

      {/* Tab 1: Customer Directory */}
      {activeSubTab === "directory" && (
        <>
          {/* Filter Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, email address..."
                value={textSearch}
                onChange={(e) => setTextSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>

            {/* Status dropdown */}
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="All">All Statuses ({customers.length})</option>
                <option value="Active">Active ({customers.filter(c => !c.isSuspended).length})</option>
                <option value="Suspended">Suspended ({customers.filter(c => c.isSuspended).length})</option>
              </select>
            </div>
          </div>

          {/* Grid of Member Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
                No customers match this filter.
              </div>
            ) : (
              filteredCustomers.map((cust) => (
                <div
                  key={cust.userId}
                  className={`bg-white rounded-xl border p-5 space-y-4 shadow-precision transition-all duration-150 flex flex-col justify-between ${
                    cust.isSuspended ? "border-red-200 bg-red-50/10 ring-1 ring-red-200/50" : "border-slate-200"
                  }`}
                >
                  {/* Member Card Header */}
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{cust.name || "Unnamed Customer"}</h3>
                      {!cust.isVerified && (
                        <span className="text-[10px] text-amber-600 font-semibold">Unverified account</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                      cust.isSuspended
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    }`}>
                      {cust.isSuspended && <ShieldAlert className="w-3 h-3 text-red-600" />}
                      {cust.isSuspended ? "Suspended" : "Active"}
                    </span>
                  </div>

                  {cust.isSuspended && (
                    <div className="space-y-1.5 -mt-2">
                      {cust.suspendedReason && (
                        <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                          <strong className="font-semibold">Reason:</strong> {cust.suspendedReason}
                        </p>
                      )}
                      {cust.appealStatus && (
                        <p className={`text-[11px] rounded-lg px-2.5 py-1 border flex items-center justify-between ${
                          cust.appealStatus === "pending"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : cust.appealStatus === "approved"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          <span>Appeal: <strong className="capitalize">{cust.appealStatus}</strong></span>
                          {cust.appealStatus === "pending" && (
                            <button
                              onClick={() => setActiveSubTab("appeals")}
                              className="underline text-[10px] font-bold text-amber-900 ml-2"
                            >
                              Review
                            </button>
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quick Contact detail info */}
                  <div className="space-y-1.5 text-xs text-slate-500 border-t border-b border-slate-100 py-3 font-medium">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cust.email || "—"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cust.phone || "—"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Customer since: {new Date(cust.joinedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Loyalty Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wide block">Balance</span>
                      <span className="text-xs font-bold font-mono text-slate-800">{formatCurrency(parseFloat(cust.creditsBalance).toFixed(2), currency)}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wide block">Spend</span>
                      <span className="text-xs font-bold font-mono text-slate-800">{formatCurrency(parseFloat(cust.totalSpend).toFixed(2), currency)}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wide block">Play Time</span>
                      <span className="text-xs font-bold font-mono text-slate-800">{formatPlayTime(cust.totalPlayMinutes)}</span>
                    </div>
                  </div>

                  {/* Custom Admin action buttons */}
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      disabled={cust.isSuspended}
                      onClick={() => setTopUpCustId(cust.userId)}
                      className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-150 border border-indigo-200/50 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Top-up</span>
                    </button>

                    <button
                      onClick={() => handleToggleClick(cust)}
                      className={`p-1.5 border rounded-lg transition-colors duration-150 ${
                        !cust.isSuspended
                          ? "bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border-slate-200"
                          : "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                      }`}
                      title={!cust.isSuspended ? "Suspend customer" : "Reactivate customer"}
                    >
                      {!cust.isSuspended ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Tab 2: Suspension Appeals */}
      {activeSubTab === "appeals" && (
        <div className="space-y-4">
          {loadingAppeals ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-xs">Loading customer suspension appeals...</p>
            </div>
          ) : appeals.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              No suspension appeals have been filed for this store.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="text-left px-4 py-3">Player</th>
                    <th className="text-left px-4 py-3">Suspension Reason</th>
                    <th className="text-left px-4 py-3">Customer's Appeal</th>
                    <th className="text-left px-4 py-3">Appealed Date</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appeals.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">{a.customerName || "Customer"}</div>
                        <div className="text-[11px] text-slate-400">{a.customerPhone || a.customerEmail || "No contact"}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs">
                        <span className="line-clamp-2">{a.reason || "Suspended by admin"}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {new Date(a.suspendedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 max-w-md">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 italic">
                          "{a.appealText || "No statement provided"}"
                        </div>
                        {a.appealResponse && (
                          <div className="text-[11px] text-slate-500 mt-1">
                            Staff note: {a.appealResponse}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {a.appealedAt ? new Date(a.appealedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                          a.appealStatus === "pending"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : a.appealStatus === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {a.appealStatus || "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {a.appealStatus === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={resolvingId === a.id}
                              onClick={() => handleResolveAppeal(a.id, "approved")}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve &amp; Lift</span>
                            </button>
                            <button
                              disabled={resolvingId === a.id}
                              onClick={() => handleResolveAppeal(a.id, "rejected")}
                              className="px-2.5 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Register Customer */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">Register New Customer</h3>
              <p className="text-xs text-slate-400 mt-1">Front-desk registration by name — phone is optional but lets them be recognized across systems.</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                  placeholder="e.g. Gordon Freeman"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Phone Number (optional)</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/10"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Wallet Top Up */}
      {topUpCustId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 font-display">Top-up Wallet Balance</h3>
              <p className="text-xs text-slate-400 mt-1">Add real credits to {customers.find(c => c.userId === topUpCustId)?.name}'s wallet — posts immediately to the ledger.</p>
            </div>

            <form onSubmit={handleTopUpSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Load Amount</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all ${
                        topUpAmount === amt
                          ? "bg-indigo-600 border-indigo-700 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      +{formatCurrency(amt, currency)}
                    </button>
                  ))}
                </div>
                <div className="pt-2">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTopUpCustId(null)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/10"
                >
                  Load Balance
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
