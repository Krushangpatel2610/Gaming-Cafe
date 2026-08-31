import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Gamepad2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle
} from "lucide-react";
import { ApiGame } from "../api/types";

interface GameLibraryViewProps {
  games: ApiGame[];
  onAddGame: (name: string, genre?: string) => void;
  onUpdateGameStatus: (gameId: string, isActive: boolean) => void;
}

export default function GameLibraryView({
  games,
  onAddGame,
  onUpdateGameStatus
}: GameLibraryViewProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [textSearch, setTextSearch] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form states for Add Game
  const [newName, setNewName] = useState<string>("");
  const [newGenre, setNewGenre] = useState<string>("");

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Game Catalog Registry</h2>
          <p className="text-xs text-slate-400 mt-1">
            The master game list every station's install list is built from. Installing a specific game onto a specific PC happens per-station, not here.
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

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Text Search */}
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

        {/* Genre dropdown */}
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

      {/* Grid of Game Cards */}
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
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
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

                {/* Action footer */}
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
              <p className="text-xs text-slate-400 mt-1">Adds to the master catalog — install it onto specific stations separately.</p>
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
    </motion.div>
  );
}
