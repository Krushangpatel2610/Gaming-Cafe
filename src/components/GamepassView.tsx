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
  Check
} from "lucide-react";
import {
  ApiGamepassPackage,
  ApiGamepassPurchase,
  getPackageSystems,
  listPendingPurchases,
  confirmPurchase,
  rejectPurchase
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
  onAddPackage: (data: { name: string, description?: string, durationMinutes: number, price: number, validityDays: number }, systemIds?: string[]) => void;
  onUpdatePackageStatus: (packageId: string, isActive: boolean) => void;
  onUpdatePackage: (packageId: string, data: { name: string, description?: string, durationMinutes: number, price: number, validityDays: number }) => void;
  onAssignSystem: (packageId: string, systemId: string) => Promise<void>;
  onUnassignSystem: (packageId: string, systemId: string) => Promise<void>;
  onNotify?: (message: string, type: "success" | "danger" | "info" | "warning") => void;
}

export default function GamepassView({
  currency,
  packages,
  systems,
  customers,
  storeId,
  onAddPackage,
  onUpdatePackageStatus,
  onUpdatePackage,
  onAssignSystem,
  onUnassignSystem,
  onNotify,
}: GamepassViewProps) {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newDuration, setNewDuration] = useState<number>(60);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newValidityDays, setNewValidityDays] = useState<number>(7);
  const [newSystemIds, setNewSystemIds] = useState<Set<string>>(new Set());

  // Edit modal state
  const [editPackage, setEditPackage] = useState<ApiGamepassPackage | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editDuration, setEditDuration] = useState<number>(60);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editValidityDays, setEditValidityDays] = useState<number>(7);

  // Station assignment modal state
  const [assignPackage, setAssignPackage] = useState<ApiGamepassPackage | null>(null);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [loadingAssign, setLoadingAssign] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Pending purchase requests state
  const [pendingPurchases, setPendingPurchases] = useState<ApiGamepassPurchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState<boolean>(false);
  const [processingPurchaseId, setProcessingPurchaseId] = useState<string | null>(null);
  const [rejectPurchaseTarget, setRejectPurchaseTarget] = useState<ApiGamepassPurchase | null>(null);
  const [rejectPurchaseReason, setRejectPurchaseReason] = useState<string>("");

  const handleAddPackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPackage({
      name: newName,
      description: newDescription || undefined,
      durationMinutes: newDuration,
      price: newPrice,
      validityDays: newValidityDays
    }, newSystemIds.size > 0 ? Array.from(newSystemIds) : undefined);
    setShowAddModal(false);
    setNewName("");
    setNewDescription("");
    setNewDuration(60);
    setNewPrice(0);
    setNewValidityDays(7);
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
  };

  const closeEditModal = () => {
    setEditPackage(null);
  };

  const handleEditPackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPackage) return;
    onUpdatePackage(editPackage.id, {
      name: editName,
      description: editDescription || undefined,
      durationMinutes: editDuration,
      price: editPrice,
      validityDays: editValidityDays,
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

  const refreshPendingPurchases = useCallback(async () => {
    if (!storeId) return;
    setLoadingPurchases(true);
    try {
      const res = await listPendingPurchases(storeId, { status: "pending", limit: 50 });
      setPendingPurchases(res.data);
    } catch (err) {
      console.error("Failed to load pending gamepass purchases:", err);
    } finally {
      setLoadingPurchases(false);
    }
  }, [storeId]);

  useEffect(() => {
    refreshPendingPurchases();
  }, [refreshPendingPurchases]);

  const handleConfirmPurchase = async (purchase: ApiGamepassPurchase) => {
    if (!storeId) return;
    setProcessingPurchaseId(purchase.id);
    try {
      await confirmPurchase(storeId, purchase.id);
      const pkgName = purchase.package?.name || packages.find(p => p.id === purchase.packageId)?.name || "Gamepass";
      if (onNotify) {
        onNotify(`Confirmed ${pkgName} purchase — pass activated.`, "success");
      }
      await refreshPendingPurchases();
    } catch (err) {
      if (onNotify) {
        onNotify(`Failed to confirm purchase: ${err instanceof Error ? err.message : "unknown error"}`, "danger");
      }
    } finally {
      setProcessingPurchaseId(null);
    }
  };

  const handleRejectPurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !rejectPurchaseTarget) return;
    setProcessingPurchaseId(rejectPurchaseTarget.id);
    try {
      await rejectPurchase(storeId, rejectPurchaseTarget.id, rejectPurchaseReason);
      if (onNotify) {
        onNotify("Gamepass purchase request rejected.", "info");
      }
      setRejectPurchaseTarget(null);
      setRejectPurchaseReason("");
      await refreshPendingPurchases();
    } catch (err) {
      if (onNotify) {
        onNotify(`Failed to reject purchase: ${err instanceof Error ? err.message : "unknown error"}`, "danger");
      }
    } finally {
      setProcessingPurchaseId(null);
    }
  };

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
          <h2 className="text-xl font-bold text-slate-900 font-display">Gamepass Packages</h2>
          <p className="text-xs text-slate-400 mt-1">
            Create packages of time that players can buy. Use <span className="font-medium text-slate-500">Manage Stations</span> to restrict where passes are used.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/10 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Gamepass</span>
        </button>
      </div>

      {/* Pending Gamepass Purchase Requests */}
      {pendingPurchases.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-precision overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900">
                Pending Gamepass Requests ({pendingPurchases.length})
              </h3>
            </div>
            <button
              onClick={refreshPendingPurchases}
              disabled={loadingPurchases}
              className="p-1 hover:bg-amber-100 rounded text-amber-700 transition-colors"
              title="Refresh requests"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPurchases ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingPurchases.map((purchase) => {
              const cust = customers?.find((c) => c.userId === purchase.userId);
              const pkg = purchase.package || packages.find((p) => p.id === purchase.packageId);
              const priceNum = pkg ? parseFloat(pkg.price) : 0;
              return (
                <div key={purchase.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{pkg?.name || "Gamepass Package"}</span>
                      {pkg && (
                        <span className="font-mono font-bold text-indigo-600 text-xs bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          {formatCurrency(priceNum, currency)}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {cust?.name || cust?.phone || purchase.userId.slice(0, 8)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Requested: {new Date(purchase.createdAt).toLocaleString()} · Duration: {pkg?.durationMinutes ? `${Math.floor(pkg.durationMinutes / 60)}h ${pkg.durationMinutes % 60 ? `${pkg.durationMinutes % 60}m` : ''}` : 'Custom'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleConfirmPurchase(purchase)}
                      disabled={processingPurchaseId === purchase.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      {processingPurchaseId === purchase.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Confirm</span>
                    </button>
                    <button
                      onClick={() => setRejectPurchaseTarget(purchase)}
                      disabled={processingPurchaseId === purchase.id}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gamepass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {packages.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
            No gamepasses created yet.
          </div>
        ) : (
          packages.map((pkg) => (
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
                    <span className="font-bold text-slate-700">{pkg.durationMinutes} min</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5"/> Price</span>
                    <span className="font-bold text-slate-700">{formatCurrency(pkg.price, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Valid for {pkg.validityDays} days</span>
                  </div>
                </div>

                <span className={`self-start px-2 py-0.5 rounded text-[9px] font-mono font-bold border flex items-center gap-1 ${
                  pkg.isActive
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-red-700 bg-red-50 border-red-200"
                }`}>
                  {pkg.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {pkg.isActive ? "Active" : "Archived"}
                </span>

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
          ))
        )}
      </div>

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
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Validity (Days)</label>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Available on Specific PCs (optional)</label>
                <p className="text-[10px] text-slate-400 mb-1">Leave all unchecked to make this pass available on every station.</p>
                <div className="max-h-32 overflow-y-auto space-y-1 border border-slate-200 rounded-lg p-2 bg-slate-50">
                  {systems.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-2">No stations registered yet.</p>
                  ) : (
                    systems.map((sys) => (
                      <label
                        key={sys.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-white select-none"
                      >
                        <input
                          type="checkbox"
                          checked={newSystemIds.has(sys.id)}
                          onChange={() => toggleNewSystemId(sys.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-700 truncate">{sys.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

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
                  Create Gamepass
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
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">Edit Gamepass</h3>
              <p className="text-xs text-slate-400 mt-1">Station assignments are managed separately via "Manage Stations".</p>
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
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Validity (Days)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editValidityDays}
                  onChange={(e) => setEditValidityDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                />
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

      {/* MODAL: Station Assignments */}
      {assignPackage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Station Assignments</h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{assignPackage.name}</p>
                <p className="text-[10px] text-slate-400 mt-1 italic">When no stations are selected, this package is available on ALL stations.</p>
              </div>
              <button onClick={closeAssignModal} className="text-slate-400 hover:text-slate-700 mt-0.5 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
              {loadingAssign ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading assignments…
                </div>
              ) : assignError ? (
                <div className="flex items-center gap-2 text-red-600 text-xs py-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {assignError}
                </div>
              ) : systems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No stations registered yet. Add stations in Live PCs first.</p>
              ) : (
                systems.map((sys) => {
                  const installed = installedIds.has(sys.id);
                  const toggling = togglingId === sys.id;
                  return (
                    <label
                      key={sys.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all select-none ${
                        installed ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                      } ${togglingId && togglingId !== sys.id ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <div className="shrink-0 w-4 h-4 flex items-center justify-center">
                        {toggling ? (
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        ) : (
                          <input
                            type="checkbox"
                            checked={installed}
                            onChange={() => handleToggleSystem(sys.id)}
                            disabled={!!togglingId}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-700 truncate">{sys.name}</span>
                      </div>
                      {installed && (
                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded shrink-0">
                          RESTRICTED TO
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-mono">
                {installedIds.size === 0 
                  ? "Available on ALL stations" 
                  : `Restricted to ${installedIds.size} station${installedIds.size !== 1 ? "s" : ""}`}
              </p>
              <button
                onClick={closeAssignModal}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: Reject Gamepass Purchase */}
      {rejectPurchaseTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 font-display">Reject Gamepass Request</h3>
              <p className="text-xs text-slate-400 mt-1">Please provide a reason for rejecting this purchase.</p>
            </div>
            <form onSubmit={handleRejectPurchaseSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Reason</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={rejectPurchaseReason}
                  onChange={(e) => setRejectPurchaseReason(e.target.value)}
                  placeholder="e.g. Payment not verified on UPI app"
                  className="w-full mt-1 px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-slate-50"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setRejectPurchaseTarget(null); setRejectPurchaseReason(""); }}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPurchaseId === rejectPurchaseTarget.id}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-red-500/10 flex items-center justify-center gap-1"
                >
                  {processingPurchaseId === rejectPurchaseTarget.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Reject</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
