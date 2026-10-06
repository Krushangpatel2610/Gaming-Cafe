import React, { useState, useCallback } from "react";
import { motion } from "motion/react";
import {
  AppWindow,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Monitor,
  X,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2
} from "lucide-react";
import { ApiApp } from "../api/types";
import { getAppSystems } from "../api/apps";

interface SystemOption {
  id: string;
  name: string;
}

interface AppLibraryViewProps {
  apps: ApiApp[];
  systems: SystemOption[];
  storeId: string;
  onAddApp: (name: string, category: string, executablePath: string, launchArgs?: string) => void;
  onUpdateAppStatus: (appId: string, isActive: boolean) => void;
  onInstallApp: (appId: string, systemId: string, executablePath?: string | null) => Promise<void>;
  onUninstallApp: (appId: string, systemId: string) => Promise<void>;
  onUpdateApp: (appId: string, data: { name?: string; category?: string; executablePath?: string; launchArgs?: string }) => void;
  onDeleteApp: (appId: string, name: string) => void;
}

const DEFAULT_CATEGORIES = ["Browsers", "Game Launchers", "Utilities", "Communication", "Media"];

export default function AppLibraryView({
  apps,
  systems,
  storeId,
  onAddApp,
  onUpdateAppStatus,
  onInstallApp,
  onUninstallApp,
  onUpdateApp,
  onDeleteApp,
}: AppLibraryViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [textSearch, setTextSearch] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("Utilities");
  const [newLaunchArgs, setNewLaunchArgs] = useState<string>("");

  // Edit modal state
  const [editApp, setEditApp] = useState<ApiApp | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("Utilities");
  const [editLaunchArgs, setEditLaunchArgs] = useState<string>("");

  // Station assignment modal state
  const [assignApp, setAssignApp] = useState<ApiApp | null>(null);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [stationPaths, setStationPaths] = useState<Record<string, string>>({});
  const [savingPathId, setSavingPathId] = useState<string | null>(null);
  const [loadingAssign, setLoadingAssign] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const categories = ["All", ...Array.from(new Set([...DEFAULT_CATEGORIES, ...apps.map(a => a.category).filter(Boolean)]))];

  const filteredApps = apps.filter(a => {
    const matchesCat = selectedCategory === "All" || a.category === selectedCategory;
    const matchesText = a.name.toLowerCase().includes(textSearch.toLowerCase());
    return matchesCat && matchesText;
  });

  const handleAddAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddApp(newName, newCategory, "", newLaunchArgs || undefined);
    setShowAddModal(false);
    setNewName("");
    setNewCategory("Utilities");
    setNewLaunchArgs("");
  };

  const openEditModal = (app: ApiApp) => {
    setEditApp(app);
    setEditName(app.name);
    setEditCategory(app.category || "Utilities");
    setEditLaunchArgs(app.launchArgs || "");
  };

  const closeEditModal = () => {
    setEditApp(null);
    setEditName("");
    setEditCategory("Utilities");
    setEditLaunchArgs("");
  };

  const handleEditAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editApp) return;
    onUpdateApp(editApp.id, {
      name: editName,
      category: editCategory,
      launchArgs: editLaunchArgs || undefined,
    });
    closeEditModal();
  };

  const handleDeleteClick = (app: ApiApp) => {
    if (window.confirm(`Permanently delete "${app.name}" from the registry? This also removes it from every station it's assigned to.`)) {
      onDeleteApp(app.id, app.name);
    }
  };

  const openAssignModal = useCallback(async (app: ApiApp) => {
    setAssignApp(app);
    setInstalledIds(new Set());
    setStationPaths({});
    setLoadingAssign(true);
    setAssignError(null);
    try {
      const assignments = await getAppSystems(storeId, app.id);
      const ids = new Set<string>();
      const paths: Record<string, string> = {};
      for (const item of assignments) {
        ids.add(item.systemId);
        paths[item.systemId] = item.executablePath || "";
      }
      setInstalledIds(ids);
      setStationPaths(paths);
    } catch {
      setAssignError("Could not load station assignments.");
    } finally {
      setLoadingAssign(false);
    }
  }, [storeId]);

  const closeAssignModal = () => {
    setAssignApp(null);
    setInstalledIds(new Set());
    setStationPaths({});
    setAssignError(null);
    setTogglingId(null);
  };

  const handleToggleSystem = async (systemId: string) => {
    if (!assignApp || togglingId) return;
    setTogglingId(systemId);
    const wasInstalled = installedIds.has(systemId);
    try {
      if (wasInstalled) {
        await onUninstallApp(assignApp.id, systemId);
        setInstalledIds(prev => { const n = new Set(prev); n.delete(systemId); return n; });
      } else {
        await onInstallApp(assignApp.id, systemId, stationPaths[systemId] || undefined);
        setInstalledIds(prev => new Set([...prev, systemId]));
      }
    } catch {
      // state unchanged on error
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveStationPath = async (systemId: string, path: string) => {
    if (!assignApp) return;
    setSavingPathId(systemId);
    try {
      await onInstallApp(assignApp.id, systemId, path || null);
      setStationPaths(prev => ({ ...prev, [systemId]: path }));
    } catch (err) {
      console.error("Failed to update path:", err);
    } finally {
      setSavingPathId(null);
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
          <h2 className="text-xl font-bold text-slate-900 font-display">App Catalog Registry</h2>
          <p className="text-xs text-slate-400 mt-1">
            Add desktop apps to the master catalog, then use <span className="font-medium text-slate-500">Manage Stations</span> on each card to assign it to specific PCs.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/10 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add App to Registry</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search apps..."
            value={textSearch}
            onChange={(e) => setTextSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* App Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredApps.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
            No applications in the registry yet — add one to get started.
          </div>
        ) : (
          filteredApps.map((app) => (
            <div
              key={app.id}
              className={`bg-white rounded-xl border shadow-precision overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all ${
                app.isActive ? "border-slate-200" : "border-slate-200 opacity-60"
              }`}
            >
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{app.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">{app.category || "General"}</p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <AppWindow className="w-4.5 h-4.5 text-indigo-500" />
                  </div>
                </div>


                <span className={`self-start px-2 py-0.5 rounded text-[9px] font-mono font-bold border flex items-center gap-1 ${
                  app.isActive
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-red-700 bg-red-50 border-red-200"
                }`}>
                  {app.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {app.isActive ? "Active in registry" : "Taken offline"}
                </span>

                <button
                  onClick={() => openAssignModal(app)}
                  className="w-full py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 text-xs border bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Manage Stations</span>
                </button>

                <button
                  onClick={() => onUpdateAppStatus(app.id, !app.isActive)}
                  className={`w-full py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1 text-xs border ${
                    app.isActive
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"
                      : "bg-blue-600 hover:bg-blue-500 border-blue-600 text-white"
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{app.isActive ? "Take Offline" : "Restore to Registry"}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(app)}
                    className="flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 text-xs border bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(app)}
                    className="flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 text-xs border bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: Add App */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">Add App to Registry</h3>
              <p className="text-xs text-slate-400 mt-1">Adds to master app catalog — assign to stations from each app card afterward.</p>
            </div>
            <form onSubmit={handleAddAppSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">App Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  placeholder="e.g. Google Chrome, Discord, Steam"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Category</label>
                <div className="flex gap-2">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  >
                    {DEFAULT_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Launch Arguments (optional)</label>
                <input
                  type="text"
                  value={newLaunchArgs}
                  onChange={(e) => setNewLaunchArgs(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 font-mono"
                  placeholder="e.g. --kiosk https://example.com"
                />
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
                  Add to Registry
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Edit App */}
      {editApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">Edit App</h3>
              <p className="text-xs text-slate-400 mt-1">Changes apply to the master catalog entry — station assignments are unaffected.</p>
            </div>
            <form onSubmit={handleEditAppSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">App Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                >
                  {DEFAULT_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Launch Arguments (optional)</label>
                <input
                  type="text"
                  value={editLaunchArgs}
                  onChange={(e) => setEditLaunchArgs(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 font-mono"
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
      {assignApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Station Assignments</h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{assignApp.name}</p>
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
                  const isSaving = savingPathId === sys.id;
                  return (
                    <div
                      key={sys.id}
                      className={`p-3 rounded-lg border transition-all ${
                        installed ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200 bg-white"
                      } ${togglingId && togglingId !== sys.id ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <div className="flex items-center gap-3">
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
                        <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer select-none" onClick={() => handleToggleSystem(sys.id)}>
                          <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700 truncate">{sys.name}</span>
                        </div>
                        {installed && (
                          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded shrink-0">
                            INSTALLED
                          </span>
                        )}
                      </div>

                      {installed && (
                        <div className="mt-2.5 pt-2.5 border-t border-indigo-100/60 pl-7 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                              Station Executable Path
                            </label>
                            {isSaving && (
                              <span className="text-[10px] text-indigo-600 flex items-center gap-1 font-mono">
                                <Loader2 className="w-3 h-3 animate-spin" /> saving…
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={stationPaths[sys.id] ?? ""}
                            onChange={(e) => setStationPaths(prev => ({ ...prev, [sys.id]: e.target.value }))}
                            onBlur={(e) => handleSaveStationPath(sys.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveStationPath(sys.id, (e.target as HTMLInputElement).value);
                              }
                            }}
                            placeholder="C:\Program Files\Google\Chrome\Application\chrome.exe"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                          <p className="text-[10px] text-slate-400">Path to the app specifically on {sys.name}. Press Enter or click outside to save.</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-mono">
                {installedIds.size}/{systems.length} station{systems.length !== 1 ? "s" : ""}
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
    </motion.div>
  );
}
