import React, { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
  Monitor,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  Search
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import {
  ApiGuestAccessRequest,
  generateGuestOtp,
  GenerateGuestOtpResponse,
  GuestAccessStatus,
  listGuestAccessRequests
} from "../api/guest-access";
import { PC, PCStatus } from "../types";

interface GuestAccessViewProps {
  pcs: PC[];
  onNotify?: (message: string, type: "success" | "danger" | "info" | "warning") => void;
}

export default function GuestAccessView({ pcs, onNotify }: GuestAccessViewProps) {
  const { storeId } = useAuth();

  // Requests state
  const [requests, setRequests] = useState<ApiGuestAccessRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [selectedSystemId, setSelectedSystemId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Active generated code card
  const [activeCode, setActiveCode] = useState<GenerateGuestOtpResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());
  const [selectedHours, setSelectedHours] = useState<number>(2);
  const [isCustomHours, setIsCustomHours] = useState<boolean>(false);
  const [customHoursInput, setCustomHoursInput] = useState<string>("2");

  // Available systems from pcs prop
  const availablePcs = pcs.filter((pc) => pc.status === PCStatus.AVAILABLE);

  // Set default selected system if none selected
  useEffect(() => {
    if (!selectedSystemId && availablePcs.length > 0) {
      setSelectedSystemId(availablePcs[0].id);
    }
  }, [availablePcs, selectedSystemId]);

  // Tick every second for countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await listGuestAccessRequests(storeId, {
        page,
        limit: 15,
        status: statusFilter === "All" ? undefined : (statusFilter as GuestAccessStatus),
      });
      setRequests(res.data);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotalCount(res.meta.total || 0);
      }
    } catch (err) {
      onNotify?.(
        `Failed to load guest requests: ${err instanceof ApiError ? err.message : "unknown error"}`,
        "danger"
      );
    } finally {
      setLoading(false);
    }
  }, [storeId, page, statusFilter, onNotify]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleGenerate = async () => {
    if (!storeId) return;
    if (!selectedSystemId) {
      onNotify?.("Please select a terminal to generate a guest code.", "warning");
      return;
    }

    const hoursToPass = isCustomHours ? (parseFloat(customHoursInput) || 2) : selectedHours;

    setGenerating(true);
    try {
      const result = await generateGuestOtp(storeId, selectedSystemId, hoursToPass);
      setActiveCode(result);
      setCopied(false);
      onNotify?.(`Guest code generated for ${result.systemName} (${hoursToPass}h)!`, "success");
      await fetchRequests();
    } catch (err) {
      onNotify?.(
        `Failed to generate guest code: ${err instanceof ApiError ? err.message : "unknown error"}`,
        "danger"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format countdown mm:ss
  const formatCountdown = (expiresAtStr: string) => {
    const diff = Math.max(0, Math.floor((new Date(expiresAtStr).getTime() - now) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return {
      expired: diff <= 0,
      formatted: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
      diffSeconds: diff,
    };
  };

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.systemName.toLowerCase().includes(q) ||
      r.code.includes(q) ||
      (r.adminName && r.adminName.toLowerCase().includes(q))
    );
  });

  const selectedPC = pcs.find((pc) => pc.id === selectedSystemId);
  const isSelectedPCAvailable = selectedPC ? selectedPC.status === PCStatus.AVAILABLE : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Guest Access & OTPs
              </h1>
              <p className="text-xs text-slate-500">
                Generate walk-in one-time codes for guests without an account and view access requests.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchRequests()}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : "text-slate-500"}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Generator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Generator Controls */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Generate Walk-In Guest Pass</span>
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                5-Min Expiry
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Issue a temporary 6-digit code for a walk-in player. The guest inputs this code on the PC's kiosk screen to start playing immediately.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Target Terminal
                </label>
                <select
                  value={selectedSystemId}
                  onChange={(e) => setSelectedSystemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                >
                  {pcs.map((pc) => (
                    <option key={pc.id} value={pc.id}>
                      {pc.name} — {pc.status} ({pc.group})
                    </option>
                  ))}
                  {pcs.length === 0 && <option value="">No systems found</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Playtime Duration (Hours)
                </label>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[1, 2, 3, 4].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => {
                        setSelectedHours(hrs);
                        setIsCustomHours(false);
                      }}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                        !isCustomHours && selectedHours === hrs
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {hrs} hr{hrs > 1 ? "s" : ""}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomHours(true);
                    }}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                      isCustomHours
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {isCustomHours && (
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={customHoursInput}
                      onChange={(e) => setCustomHoursInput(e.target.value)}
                      placeholder="e.g. 1.5, 5"
                      className="w-28 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-500 font-medium">hours of playtime</span>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-1.5">
                  The guest will receive this playtime by default upon kiosk login with no top-up message.
                </p>
              </div>

              {selectedPC && !isSelectedPCAvailable && (
                <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>{selectedPC.name}</strong> is currently <strong>{selectedPC.status}</strong>. Please select an Available terminal.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {availablePcs.length} terminal{availablePcs.length === 1 ? "" : "s"} available
            </span>
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedSystemId || !isSelectedPCAvailable}
              className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Generate Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Generated Code Display */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Active Guest Pass</span>
              </h2>
              {activeCode && (
                <div className="flex items-center space-x-2">
                  {activeCode.allocatedMinutes ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {(activeCode.allocatedMinutes / 60).toFixed(1).replace(/\.0$/, "")}h Playtime
                    </span>
                  ) : null}
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {activeCode.systemName}
                  </span>
                </div>
              )}
            </div>

            {activeCode ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center relative overflow-hidden">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-1 font-mono">
                    Terminal Access Code
                  </p>
                  <div className="text-4xl sm:text-5xl font-mono font-extrabold tracking-[0.3em] text-slate-900 my-2 select-all">
                    {activeCode.code}
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-xs font-medium text-slate-500 mt-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    {(() => {
                      const cd = formatCountdown(activeCode.expiresAt);
                      return cd.expired ? (
                        <span className="text-red-600 font-bold">Code Expired</span>
                      ) : (
                        <span>
                          Expires in <strong className="text-indigo-700 font-mono">{cd.formatted}</strong>
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-600 leading-snug">
                    Give this 6-digit code to the guest at <strong>{activeCode.systemName}</strong>.
                  </p>
                  <button
                    onClick={() => handleCopyCode(activeCode.code)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm shrink-0 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-44 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <KeyRound className="w-8 h-8 mb-2 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-500">No active code generated</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Select a terminal on the left and click "Generate Code" to create a new one-time guest access code.
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 mt-4">
            Codes automatically expire after 5 minutes if not entered at the kiosk.
          </div>
        </div>
      </div>

      {/* History & Requests Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Guest Access Requests</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit of codes generated by counter staff or requested from the kiosk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search terminal, code, staff..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52 font-medium"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex bg-slate-200/60 p-1 rounded-xl text-xs">
              {["All", "pending", "redeemed", "expired"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all capitalize ${
                    statusFilter === status
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              <tr>
                <th className="px-6 py-3.5">Terminal</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Playtime</th>
                <th className="px-6 py-3.5">Origin / Issuer</th>
                <th className="px-6 py-3.5">Generated At</th>
                <th className="px-6 py-3.5">Redeemed At</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading && requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>Loading guest requests...</span>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <KeyRound className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">No guest requests found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                       No codes match the selected criteria or none have been issued yet.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const cd = formatCountdown(req.expiresAt);
                  const isPendingAndActive = req.status === "pending" && !cd.expired;
                  const isPendingAndExpired = req.status === "pending" && cd.expired;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center space-x-2.5">
                          <Monitor className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-900">{req.systemName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-800 text-sm tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                            {req.code}
                          </span>
                          <button
                            title="Copy code"
                            onClick={() => handleCopyCode(req.code)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        {req.status === "redeemed" ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Redeemed</span>
                          </span>
                        ) : isPendingAndActive ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                            <span>Pending ({cd.formatted})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Expired</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {req.allocatedMinutes ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            <span>{(req.allocatedMinutes / 60).toFixed(1).replace(/\.0$/, "")}h</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        {req.adminName ? (
                          <div>
                            <span className="font-bold text-slate-800">{req.adminName}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">Staff Console</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-indigo-600">Kiosk Self-Service</span>
                            <span className="block text-[10px] text-slate-400 font-mono">Emailed Staff</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(req.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">
                        {req.redeemedAt ? (
                          new Date(req.redeemedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {isPendingAndActive && (
                          <button
                            onClick={() =>
                              setActiveCode({
                                code: req.code,
                                systemId: req.systemId,
                                systemName: req.systemName,
                                expiresInSeconds: cd.diffSeconds,
                                expiresAt: req.expiresAt,
                                allocatedMinutes: req.allocatedMinutes,
                              })
                            }
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                          >
                            Display PIN
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
