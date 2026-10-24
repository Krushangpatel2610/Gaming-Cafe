import { formatCurrency, currencySymbol } from '../lib/currency';
import React, { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import {
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Monitor,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Banknote,
  Pencil,
  Check,
  Users,
  Calendar,
  History,
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import {
  ApiGamepassPackage,
  ApiGamepassPurchase,
  getPackageSystems,
  listAllPurchases,
  extendPurchase
} from "../api/gamepass";
import { ApiCustomer } from "../api/types";

interface SystemOption {
  id: string;
  name: string;
}

interface GamepassViewProps {
  currency: string;
  packages: ApiGamepassPackage[];
  systems: SystemOption[];
  customers?: ApiCustomer[];
  storeId: string;
  onAddPackage: (data: { name: string, description?: string, durationMinutes: number, price: number, validityDays: number, validityUnit?: "days" | "hours" | "hrs", availableDuration?: number | null, availableUnit?: "days" | "hours" | "hrs" }, systemIds?: string[]) => void;
  onUpdatePackageStatus: (packageId: string, isActive: boolean) => void;
  onUpdatePackage: (packageId: string, data: { name: string, description?: string, durationMinutes: number, price: number, validityDays: number, validityUnit?: "days" | "hours" | "hrs", availableDuration?: number | null, availableUnit?: "days" | "hours" | "hrs" }) => void;
  onAssignSystem: (packageId: string, systemId: string) => Promise<void>;
  onUnassignSystem: (packageId: string, systemId: string) => Promise<void>;
  onNotify?: (message: string, type: "success" | "danger" | "info" | "warning") => void;
}

export default function GamepassView({
  currency,
  packages,
  systems,
  customers = [],
  storeId,
  onAddPackage,
  onUpdatePackageStatus,
  onUpdatePackage,
  onAssignSystem,
  onUnassignSystem,
  onNotify,
}: GamepassViewProps) {
  const [subTab, setSubTab] = useState<"packages" | "history">("packages");

  // Purchases list state
  const [allPurchases, setAllPurchases] = useState<ApiGamepassPurchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("all");

  // Add modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newDuration, setNewDuration] = useState<number>(60);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newValidityDays, setNewValidityDays] = useState<number>(7);
  const [newValidityUnit, setNewValidityUnit] = useState<"days" | "hours">("days");
  const [newAvailableDuration, setNewAvailableDuration] = useState<string>("");
  const [newAvailableUnit, setNewAvailableUnit] = useState<"days" | "hours">("days");
  const [newSystemIds, setNewSystemIds] = useState<Set<string>>(new Set());

  // Edit modal state
  const [editPackage, setEditPackage] = useState<ApiGamepassPackage | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editDuration, setEditDuration] = useState<number>(60);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editValidityDays, setEditValidityDays] = useState<number>(7);
  const [editValidityUnit, setEditValidityUnit] = useState<"days" | "hours">("days");
  const [editAvailableDuration, setEditAvailableDuration] = useState<string>("");
  const [editAvailableUnit, setEditAvailableUnit] = useState<"days" | "hours">("days");

  // Station assignment modal state
  const [assignPackage, setAssignPackage] = useState<ApiGamepassPackage | null>(null);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [loadingAssign, setLoadingAssign] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Pass Holders Modal state
  const [passHoldersModalPkg, setPassHoldersModalPkg] = useState<ApiGamepassPackage | null>(null);

  // Extension Dialog state
  const [extendingPurchase, setExtendingPurchase] = useState<ApiGamepassPurchase | null>(null);
  const [extendPresetDays, setExtendPresetDays] = useState<number>(7);
  const [customExtendExpiresAt, setCustomExtendExpiresAt] = useState<string>("");
  const [extraMinutesToAdd, setExtraMinutesToAdd] = useState<number>(0);
  const [savingExtension, setSavingExtension] = useState<boolean>(false);

  const loadPurchases = useCallback(async () => {
    if (!storeId) return;
    setLoadingPurchases(true);
    try {
      const res = await listAllPurchases(storeId, { limit: 100 });
      setAllPurchases(res.data || []);
    } catch {
      // non-fatal
    } finally {
      setLoadingPurchases(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const handleAddPackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const availDur = newAvailableDuration ? parseInt(newAvailableDuration) : undefined;
    onAddPackage({
      name: newName,
      description: newDescription || undefined,
      durationMinutes: newDuration,
      price: newPrice,
      validityDays: newValidityDays,
      validityUnit: newValidityUnit,
      availableDuration: availDur,
      availableUnit: availDur ? newAvailableUnit : undefined,
    }, newSystemIds.size > 0 ? Array.from(newSystemIds) : undefined);
    setShowAddModal(false);
    setNewName("");
    setNewDescription("");
    setNewDuration(60);
    setNewPrice(0);
    setNewValidityDays(7);
    setNewValidityUnit("days");
    setNewAvailableDuration("");
    setNewAvailableUnit("days");
    setNewSystemIds(new Set());
  };

  const toggleNewSystemId = (systemId: string) => {
    setNewSystemIds(prev => {
      const n = new Set(prev);
      if (n.has(systemId)) n.delete(systemId); else n.add(systemId);
      return n;
    });
  };

  const openEditModal = (pkg: ApiGamepassPackage) => {
    setEditPackage(pkg);
    setEditName(pkg.name);
    setEditDescription(pkg.description || "");
    setEditDuration(pkg.durationMinutes);
    setEditPrice(parseFloat(pkg.price));
    setEditValidityDays(pkg.validityDays);
    setEditValidityUnit(pkg.validityUnit === "hours" || pkg.validityUnit === "hrs" ? "hours" : "days");
    setEditAvailableDuration(pkg.availableDuration != null ? String(pkg.availableDuration) : "");
    setEditAvailableUnit(pkg.availableUnit === "hours" || pkg.availableUnit === "hrs" ? "hours" : "days");
  };

  const closeEditModal = () => {
    setEditPackage(null);
  };

  const handleEditPackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPackage) return;
    const availDur = editAvailableDuration ? parseInt(editAvailableDuration) : undefined;
    onUpdatePackage(editPackage.id, {
      name: editName,
      description: editDescription || undefined,
      durationMinutes: editDuration,
      price: editPrice,
      validityDays: editValidityDays,
      validityUnit: editValidityUnit,
      availableDuration: availDur,
      availableUnit: availDur ? editAvailableUnit : undefined,
    });
    closeEditModal();
  };

  const openAssignModal = useCallback(async (pkg: ApiGamepassPackage) => {
    setAssignPackage(pkg);
    setInstalledIds(new Set());
    setLoadingAssign(true);
    setAssignError(null);
    try {
      const ids = await getPackageSystems(storeId, pkg.id);
      setInstalledIds(new Set(ids));
    } catch {
      setAssignError("Could not load station assignments.");
    } finally {
      setLoadingAssign(false);
    }
  }, [storeId]);

  const closeAssignModal = () => {
    setAssignPackage(null);
    setInstalledIds(new Set());
    setAssignError(null);
    setTogglingId(null);
  };

  const handleToggleSystem = async (systemId: string) => {
    if (!assignPackage || togglingId) return;
    setTogglingId(systemId);
    const wasInstalled = installedIds.has(systemId);
    try {
      if (wasInstalled) {
        await onUnassignSystem(assignPackage.id, systemId);
        setInstalledIds(prev => { const n = new Set(prev); n.delete(systemId); return n; });
      } else {
        await onAssignSystem(assignPackage.id, systemId);
        setInstalledIds(prev => new Set([...prev, systemId]));
      }
    } catch {
      // state unchanged on error
    } finally {
      setTogglingId(null);
    }
  };

  const openPassHoldersModal = (pkg: ApiGamepassPackage) => {
    setPassHoldersModalPkg(pkg);
    loadPurchases();
  };

  const startExtension = (purchase: ApiGamepassPurchase) => {
    setExtendingPurchase(purchase);
    setExtendPresetDays(7);
    setCustomExtendExpiresAt("");
    setExtraMinutesToAdd(0);
  };

  const handleExtensionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingPurchase) return;
    setSavingExtension(true);
    try {
      await extendPurchase(storeId, extendingPurchase.id, {
        extendDays: customExtendExpiresAt ? undefined : extendPresetDays,
        newExpiresAt: customExtendExpiresAt ? new Date(customExtendExpiresAt).toISOString() : undefined,
        addRemainingMinutes: extraMinutesToAdd > 0 ? extraMinutesToAdd : undefined,
      });
      onNotify?.("Gamepass validity extended successfully!", "success");
      setExtendingPurchase(null);
      await loadPurchases();
    } catch (err: any) {
      onNotify?.(err?.message || "Failed to extend gamepass", "danger");
    } finally {
      setSavingExtension(false);
    }
  };

  const getCustomerInfo = (userId: string) => {
    const cust = customers.find(c => c.userId === userId);
    return {
      name: cust?.name || `Customer ${userId.slice(0, 6)}`,
      phone: cust?.phone || null,
      email: cust?.email || null,
    };
  };

  // Filter package holders: must have remainingMinutes > 0 (even if expired, but strictly omit 0 remaining minutes)
  const activeHoldersForModal = passHoldersModalPkg
    ? allPurchases.filter(p =>
        p.packageId === passHoldersModalPkg.id &&
        p.remainingMinutes != null &&
        p.remainingMinutes > 0
      )
    : [];

  const filteredHistory = allPurchases.filter(p => {
    const cust = getCustomerInfo(p.userId);
    const pkgName = p.package?.name || packages.find(pkg => pkg.id === p.packageId)?.name || "";
    const haystack = `${cust.name} ${cust.phone || ""} ${cust.email || ""} ${pkgName}`.toLowerCase();
    const matchesSearch = haystack.includes(historySearch.toLowerCase());
    const matchesStatus = historyStatusFilter === "all" || p.status === historyStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Gamepass Packages &amp; Redemptions</h2>
          <p className="text-xs text-slate-400 mt-1">
            Create time packages for players, inspect pass holders with remaining hours, and extend validity for inactive players.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/10 transition-all flex items-center space-x-1.5 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Gamepass</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSubTab("packages")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              subTab === "packages"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>Packages Catalog</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              subTab === "packages" ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {packages.length}
            </span>
          </button>

          <button
            onClick={() => { setSubTab("history"); loadPurchases(); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              subTab === "history"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Holders &amp; History</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              subTab === "history" ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {allPurchases.length}
            </span>
          </button>
        </div>

        <button
          onClick={loadPurchases}
          disabled={loadingPurchases}
          className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg text-xs flex items-center gap-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingPurchases ? "animate-spin" : ""}`} />
          <span>Sync</span>
        </button>
      </div>

      {/* SUB-TAB 1: Packages */}
      {subTab === "packages" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {packages.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
              No gamepasses created yet.
            </div>
          ) : (
            packages.map((pkg) => {
              // Count holders with time remaining
              const unspentHoldersCount = allPurchases.filter(
                p => p.packageId === pkg.id && p.remainingMinutes != null && p.remainingMinutes > 0
              ).length;

              return (
                <div
                  key={pkg.id}
                  className={`bg-white rounded-xl border shadow-precision overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all ${
                    pkg.isActive ? "border-slate-200" : "border-slate-200 opacity-60"
                  }`}
                >
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{pkg.name}</h3>
                        <p className="text-[11px] text-slate-400 font-medium line-clamp-2 mt-0.5">{pkg.description || "No description"}</p>
                      </div>
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <Clock className="w-4.5 h-4.5 text-emerald-500" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2 mb-1 border-y border-slate-100 py-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Duration</span>
                        <span className="font-bold text-slate-700">{pkg.durationMinutes} min ({Math.floor(pkg.durationMinutes / 60)}h)</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5"/> Price</span>
                        <span className="font-bold text-slate-700">{formatCurrency(pkg.price, currency)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span>Valid for {pkg.validityDays} {pkg.validityUnit === "hours" || pkg.validityUnit === "hrs" ? "hrs" : "days"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border flex items-center gap-1 ${
                        pkg.isActive
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-red-700 bg-red-50 border-red-200"
                      }`}>
                        {pkg.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {pkg.isActive ? "Active" : "Archived"}
                      </span>

                      {unspentHoldersCount > 0 && (
                        <span className="text-[10px] text-indigo-700 font-medium">
                          {unspentHoldersCount} with hours left
                        </span>
                      )}
                    </div>

                    {/* Pass Holders / Extend Button */}
                    <button
                      onClick={() => openPassHoldersModal(pkg)}
                      className="w-full py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 text-xs border bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pass Holders / Extend ({unspentHoldersCount})</span>
                    </button>

                    <button
                      onClick={() => openAssignModal(pkg)}
                      className="w-full py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 text-xs border bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Manage Stations</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(pkg)}
                        className="flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 text-xs border bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onUpdatePackageStatus(pkg.id, !pkg.isActive)}
                        className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1 text-xs border ${
                          pkg.isActive
                            ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"
                            : "bg-blue-600 hover:bg-blue-500 border-blue-600 text-white"
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{pkg.isActive ? "Archive" : "Restore"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-TAB 2: History & Extensions */}
      {subTab === "history" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search purchaser name, phone, package..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>

            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="all">All Statuses ({allPurchases.length})</option>
                <option value="confirmed">Confirmed</option>
                <option value="expired">Expired</option>
                <option value="consumed">Consumed</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="text-left px-4 py-3">Player</th>
                  <th className="text-left px-4 py-3">Package</th>
                  <th className="text-left px-4 py-3">Purchased</th>
                  <th className="text-left px-4 py-3">Remaining Time</th>
                  <th className="text-left px-4 py-3">Expiry</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No gamepass purchases found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((p) => {
                    const cust = getCustomerInfo(p.userId);
                    const pkgName = p.package?.name || packages.find(pkg => pkg.id === p.packageId)?.name || "Gamepass";
                    const remMin = p.remainingMinutes ?? 0;
                    const isExpired = p.expiresAt ? new Date(p.expiresAt).getTime() < Date.now() : false;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{cust.name}</div>
                          <div className="text-[11px] text-slate-400">{cust.phone || cust.email || "No contact"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800">{pkgName}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {p.purchasedAt ? new Date(p.purchasedAt).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono font-bold ${remMin > 0 ? "text-indigo-600" : "text-slate-400"}`}>
                            {Math.floor(remMin / 60)}h {remMin % 60}m
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.expiresAt ? (
                            <span className={`text-[11px] font-mono ${isExpired ? "text-red-600" : "text-slate-600"}`}>
                              {new Date(p.expiresAt).toLocaleDateString()}
                              {isExpired && " (Expired)"}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                            p.status === "confirmed" && !isExpired
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isExpired || p.status === "expired"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : p.status === "consumed"
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : p.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>
                            {isExpired && p.status === "confirmed" ? "expired" : p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => startExtension(p)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Extend</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Pass Holders for specific package with hours remaining */}
      {passHoldersModalPkg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                  <span>Pass Holders: {passHoldersModalPkg.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing purchasers who still have hours left. You can extend validity or reactivate expired passes.
                </p>
              </div>
              <button
                onClick={() => setPassHoldersModalPkg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {activeHoldersForModal.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No active or expired pass holders with remaining time found for this package. (Customers who have fully utilized all hours are omitted).
                </div>
              ) : (
                activeHoldersForModal.map((holder) => {
                  const cust = getCustomerInfo(holder.userId);
                  const remMin = holder.remainingMinutes ?? 0;
                  const isExpired = holder.expiresAt ? new Date(holder.expiresAt).getTime() < Date.now() : false;

                  return (
                    <div
                      key={holder.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{cust.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                            isExpired
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {isExpired ? "Expired" : "Active"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span>Phone: {cust.phone || "—"}</span>
                          <span>•</span>
                          <span className="font-semibold text-indigo-600 font-mono">
                            {Math.floor(remMin / 60)}h {remMin % 60}m remaining
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {holder.expiresAt
                            ? `${isExpired ? "Expired on" : "Valid until"}: ${new Date(holder.expiresAt).toLocaleDateString()}`
                            : "No expiry set"}
                        </div>
                      </div>

                      <button
                        onClick={() => startExtension(holder)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Extend Validity</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: Extension Dialog */}
      {extendingPurchase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Extend Gamepass Validity</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Player: {getCustomerInfo(extendingPurchase.userId).name}
                </p>
              </div>
              <button
                onClick={() => setExtendingPurchase(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExtensionSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Hours Left:</span>
                  <span className="font-bold text-indigo-700 font-mono">
                    {Math.floor((extendingPurchase.remainingMinutes || 0) / 60)}h {(extendingPurchase.remainingMinutes || 0) % 60}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Expiry:</span>
                  <span className="font-mono text-slate-700">
                    {extendingPurchase.expiresAt ? new Date(extendingPurchase.expiresAt).toLocaleString() : "Never"}
                  </span>
                </div>
              </div>

              {/* Quick Preset Days */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Quick Extend Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => { setExtendPresetDays(days); setCustomExtendExpiresAt(""); }}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all ${
                        !customExtendExpiresAt && extendPresetDays === days
                          ? "bg-indigo-600 border-indigo-700 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      +{days} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Or Set Exact New Expiry Date
                </label>
                <input
                  type="datetime-local"
                  value={customExtendExpiresAt}
                  onChange={(e) => setCustomExtendExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 font-mono"
                />
              </div>

              {/* Optional: Add Extra Time */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Bonus Play Minutes to Add (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="30"
                  value={extraMinutesToAdd}
                  onChange={(e) => setExtraMinutesToAdd(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 font-mono"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendingPurchase(null)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExtension}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-1.5"
                >
                  {savingExtension ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{savingExtension ? "Saving..." : "Apply Extension"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Add Gamepass */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">New Gamepass</h3>
              <p className="text-xs text-slate-400 mt-1">Create a new time package for players.</p>
            </div>
            <form onSubmit={handleAddPackageSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Package Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  placeholder="e.g. 3 Hour Weekend Pass"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Description (optional)</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  placeholder="e.g. Perfect for afternoon gaming"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Duration (minutes)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newDuration}
                    onChange={(e) => setNewDuration(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Price ({currencySymbol(currency)})</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Validity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newValidityDays}
                    onChange={(e) => setNewValidityDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Validity Unit</label>
                  <select
                    value={newValidityUnit}
                    onChange={(e) => setNewValidityUnit(e.target.value as "days" | "hours")}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  >
                    <option value="days">Days</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Available For</label>
                  <input
                    type="number"
                    min={1}
                    value={newAvailableDuration}
                    onChange={(e) => setNewAvailableDuration(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Duration Unit</label>
                  <select
                    value={newAvailableUnit}
                    onChange={(e) => setNewAvailableUnit(e.target.value as "days" | "hours")}
                    disabled={!newAvailableDuration}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 disabled:opacity-50"
                  >
                    <option value="days">Days</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>

              {/* Station restriction toggle */}
              {systems.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Restrict to Stations (optional)</label>
                    <span className="text-[10px] text-slate-400">{newSystemIds.size === 0 ? "All stations" : `${newSystemIds.size} selected`}</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                    {systems.map((s) => (
                      <label key={s.id} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer hover:bg-white p-1 rounded">
                        <input
                          type="checkbox"
                          checked={newSystemIds.has(s.id)}
                          onChange={() => toggleNewSystemId(s.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{s.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-blue-500/10"
                >
                  Create Package
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Edit Gamepass */}
      {editPackage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Edit Gamepass</h3>
                <p className="text-xs text-slate-400 mt-1">Update package details.</p>
              </div>
              <button onClick={closeEditModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditPackageSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Package Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Description (optional)</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Duration (minutes)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Price ({currencySymbol(currency)})</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Validity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editValidityDays}
                    onChange={(e) => setEditValidityDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Validity Unit</label>
                  <select
                    value={editValidityUnit}
                    onChange={(e) => setEditValidityUnit(e.target.value as "days" | "hours")}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  >
                    <option value="days">Days</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Available For</label>
                  <input
                    type="number"
                    min={1}
                    value={editAvailableDuration}
                    onChange={(e) => setEditAvailableDuration(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Duration Unit</label>
                  <select
                    value={editAvailableUnit}
                    onChange={(e) => setEditAvailableUnit(e.target.value as "days" | "hours")}
                    disabled={!editAvailableDuration}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 disabled:opacity-50"
                  >
                    <option value="days">Days</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-blue-500/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Manage Stations */}
      {assignPackage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Manage Stations</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Package: <span className="font-semibold text-slate-700">{assignPackage.name}</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  {installedIds.size === 0
                    ? "Available on all stations (no restrictions)"
                    : `Restricted to ${installedIds.size} station(s)`}
                </p>
              </div>
              <button onClick={closeAssignModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-2">
              {loadingAssign ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <p className="text-xs">Loading station assignments...</p>
                </div>
              ) : assignError ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{assignError}</span>
                </div>
              ) : systems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No stations found in this store.</p>
              ) : (
                systems.map((s) => {
                  const isInstalled = installedIds.has(s.id);
                  const isToggling = togglingId === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isInstalled
                          ? "bg-blue-50/50 border-blue-200 text-blue-900"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Monitor className={`w-4 h-4 ${isInstalled ? "text-blue-600" : "text-slate-400"}`} />
                        <span className="text-xs font-semibold">{s.name}</span>
                      </div>
                      <button
                        disabled={isToggling}
                        onClick={() => handleToggleSystem(s.id)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center space-x-1 ${
                          isInstalled
                            ? "bg-blue-600 hover:bg-blue-500 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isInstalled ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Assigned</span>
                          </>
                        ) : (
                          <span>Assign</span>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={closeAssignModal}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
