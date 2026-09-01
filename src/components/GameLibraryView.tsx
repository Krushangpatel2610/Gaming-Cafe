import React, { useState, useCallback } from "react";
import { motion } from "motion/react";
import {
  Gamepad2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Monitor,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { ApiGame } from "../api/types";
import { getGameSystems } from "../api/games";

interface SystemOption {
  id: string;
  name: string;
}

interface GameLibraryViewProps {
  games: ApiGame[];
  systems: SystemOption[];
  storeId: string;
  onAddGame: (name: string, genre?: string) => void;
  onUpdateGameStatus: (gameId: string, isActive: boolean) => void;
  onInstallGame: (gameId: string, systemId: string) => Promise<void>;
  onUninstallGame: (gameId: string, systemId: string) => Promise<void>;
}

export default function GameLibraryView({
  games,
  systems,
  storeId,
  onAddGame,
  onUpdateGameStatus,
  onInstallGame,
  onUninstallGame,
}: GameLibraryViewProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [textSearch, setTextSearch] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newGenre, setNewGenre] = useState<string>("");

  // Station assignment modal state
  const [assignGame, setAssignGame] = useState<ApiGame | null>(null);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [loadingAssign, setLoadingAssign] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const genres = ["All", ...Array.from(new Set(games.map(g => g.genre).filter(Boolean) as string[]))];

  const filteredGames = games.filter(g => {
    const matchesGenre = selectedGenre === "All" || g.genre === selectedGenre;
    const matchesText = g.name.toLowerCase().includes(textSearch.toLowerCase());
    return matchesGenre && matchesText;
  });

  const handleAddGameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddGame(newName, newGenre || undefined);
    setShowAddModal(false);
    setNewName("");
    setNewGenre("");
  };

  const openAssignModal = useCallback(async (game: ApiGame) => {
    setAssignGame(game);
    setInstalledIds(new Set());
    setLoadingAssign(true);
    setAssignError(null);
    try {
      const ids = await getGameSystems(storeId, game.id);
      setInstalledIds(new Set(ids));
    } catch {
      setAssignError("Could not load station assignments.");
    } finally {
      setLoadingAssign(false);
    }
  }, [storeId]);

  const closeAssignModal = () => {
    setAssignGame(null);
    setInstalledIds(new Set());
    setAssignError(null);
    setTogglingId(null);
  };

  const handleToggleSystem = async (systemId: string) => {
    if (!assignGame || togglingId) return;
    setTogglingId(systemId);
    const wasInstalled = installedIds.has(systemId);
    try {
      if (wasInstalled) {
        await onUninstallGame(assignGame.id, systemId);
        setInstalledIds(prev => { const n = new Set(prev); n.delete(systemId); return n; });
      } else {
        await onInstallGame(assignGame.id, systemId);
        setInstalledIds(prev => new Set([...prev, systemId]));
      }
    } catch {
      // state unchanged on error
    } finally {
      setTogglingId(null);
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
          <h2 className="text-xl font-bold text-slate-900 font-display">Game Catalog Registry</h2>
          <p className="text-xs text-slate-400 mt-1">
            Add games to the master catalog, then use <span className="font-medium text-slate-500">Manage Stations</span> on each card to assign it to specific PCs.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/10 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Game to Registry</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search game titles..."
            value={textSearch}
            onChange={(e) => setTextSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
          >
            {genres.map((g) => (
              <option key={g} value={g}>{g === "All" ? "All Genres" : g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Game Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredGames.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
            No games in the registry yet — add one to get started.
          </div>
        ) : (
          filteredGames.map((game) => (
            <div
              key={game.id}
              className={`bg-white rounded-xl border shadow-precision overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all ${
                game.isActive ? "border-slate-200" : "border-slate-200 opacity-60"
              }`}
            >
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{game.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">{game.genre || "Uncategorized"}</p>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    <Gamepad2 className="w-4.5 h-4.5 text-blue-500" />
                  </div>
                </div>

                <span className={`self-start px-2 py-0.5 rounded text-[9px] font-mono font-bold border flex items-center gap-1 ${
                  game.isActive
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-red-700 bg-red-50 border-red-200"
                }`}>
                  {game.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {game.isActive ? "Active in registry" : "Taken offline"}
                </span>

                <button
                  onClick={() => openAssignModal(game)}
                  className="w-full py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 text-xs border bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Manage Stations</span>
                </button>

                <button
                  onClick={() => onUpdateGameStatus(game.id, !game.isActive)}
                  className={`w-full py-1.5 rounded-lg font-bold transition-all flex items-center justify-center space-x-1 text-xs border ${
                    game.isActive
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"
                      : "bg-blue-600 hover:bg-blue-500 border-blue-600 text-white"
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{game.isActive ? "Take Offline" : "Restore to Registry"}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: Add Game */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">Add Game to Registry</h3>
              <p className="text-xs text-slate-400 mt-1">Adds to the master catalog — assign to stations from each game card afterward.</p>
            </div>
            <form onSubmit={handleAddGameSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Game Title</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  placeholder="e.g. Elden Ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Genre (optional)</label>
                <input
                  type="text"
                  value={newGenre}
                  onChange={(e) => setNewGenre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  placeholder="e.g. Action RPG"
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

      {/* MODAL: Station Assignments */}
      {assignGame && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Station Assignments</h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{assignGame.name}</p>
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
                          INSTALLED
                        </span>
                      )}
                    </label>
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
