import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Gamepad2, 
  Plus, 
  Search, 
  Filter, 
  HardDrive, 
  Play, 
  RefreshCw, 
  Trash2,
  TrendingUp,
  DownloadCloud,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Game } from "../types";

interface GameLibraryViewProps {
  games: Game[];
  onAddGame: (game: Omit<Game, "id" | "launchCount" | "playTimeHours">) => void;
  onLaunchGame: (gameId: string) => void;
  onUpdateGameStatus: (gameId: string, status: "Ready" | "Updating" | "Offline") => void;
}

export default function GameLibraryView({ 
  games, 
  onAddGame, 
  onLaunchGame, 
  onUpdateGameStatus 
}: GameLibraryViewProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("All");
  const [textSearch, setTextSearch] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form states for Add Game
  const [newTitle, setNewTitle] = useState<string>("");
  const [newGenre, setNewGenre] = useState<string>("");
  const [newDev, setNewDev] = useState<string>("");
  const [newSize, setNewSize] = useState<number>(50);
  const [newImage, setNewImage] = useState<string>("");

  // Extracted genres list
  const genres = ["All", ...Array.from(new Set(games.map(g => g.genre.split(", ")[0])))];

  const filteredGames = games.filter(g => {
    const matchesGenre = selectedGenre === "All" || g.genre.includes(selectedGenre);
    const matchesText = g.title.toLowerCase().includes(textSearch.toLowerCase()) ||
                        g.developer.toLowerCase().includes(textSearch.toLowerCase());
    return matchesGenre && matchesText;
  });

  const handleAddGameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Pick standard thumbnail if none provided
    const fallbackImage = newImage || "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300&auto=format&fit=crop&q=80";

    onAddGame({
      title: newTitle,
      genre: newGenre,
      developer: newDev,
      sizeGB: newSize,
      imageUrl: fallbackImage,
      status: "Ready"
    });

    // Reset
    setShowAddModal(false);
    setNewTitle("");
    setNewGenre("");
    setNewDev("");
    setNewSize(50);
    setNewImage("");
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
          <h2 className="text-xl font-bold text-slate-900 font-display">Shared Game Library Profile</h2>
          <p className="text-xs text-slate-400 mt-1">
            Pre-installed games catalogue, storage monitoring, auto-update tasks, and launch counts.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/10 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Game</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Text Search */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search game titles, publishers, developers..."
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
        {filteredGames.map((game) => {
          
          const getStatusText = (status: string) => {
            switch (status) {
              case "Ready":
                return "text-emerald-700 bg-emerald-50 border-emerald-200";
              case "Updating":
                return "text-blue-700 bg-blue-50 border-blue-200 animate-pulse";
              case "Offline":
                return "text-red-700 bg-red-50 border-red-200";
              default:
                return "text-slate-500 bg-slate-50 border-slate-200";
            }
          };

          return (
            <div
              key={game.id}
              className="bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all group"
            >
              {/* Card Banner Image */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img 
                  src={game.imageUrl} 
                  alt={game.title} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                
                {/* Size badge */}
                <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono font-bold text-slate-300 flex items-center space-x-1">
                  <HardDrive className="w-3 h-3 text-slate-400" />
                  <span>{game.sizeGB} GB</span>
                </div>

                {/* Status Overlay */}
                <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border shadow-sm ${getStatusText(game.status)}`}>
                    {game.status} {game.status === "Updating" && `(${game.updateProgress}%)`}
                  </span>
                </div>
              </div>

              {/* Game Contents */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{game.title}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">{game.developer}</p>
                </div>

                {/* Simulated engagement stats */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono py-2.5 border-t border-b border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block">Launch Count:</span>
                    <span className="text-slate-700 font-bold">{game.launchCount} plays</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block">Avg Time Today:</span>
                    <span className="text-slate-700 font-bold">{game.playTimeHours} hrs</span>
                  </div>
                </div>

                {/* Update Progression Bar (only if updating) */}
                {game.status === "Updating" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-blue-700 font-bold font-mono">
                      <span>Downloading Assets...</span>
                      <span>{game.updateProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${game.updateProgress}%` }} />
                    </div>
                  </div>
                )}

                {/* Action footer */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <button
                    disabled={game.status !== "Ready"}
                    onClick={() => onLaunchGame(game.id)}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-150 border border-blue-600 text-white rounded-lg font-bold transition-all flex items-center justify-center space-x-1 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch</span>
                  </button>

                  {game.status === "Offline" ? (
                    <button
                      onClick={() => onUpdateGameStatus(game.id, "Updating")}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg"
                      title="Run client update check"
                    >
                      <DownloadCloud className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const nextStatus = game.status === "Ready" ? "Offline" : "Ready";
                        onUpdateGameStatus(game.id, nextStatus);
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 rounded-lg"
                      title={game.status === "Ready" ? "Take game offline" : "Restore online status"}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
              <h3 className="text-lg font-bold text-slate-900 font-display">Install Game in Lounge Directory</h3>
              <p className="text-xs text-slate-400 mt-1">Add game details and set standard disk space usage bounds.</p>
            </div>
            
            <form onSubmit={handleAddGameSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Game Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                  placeholder="e.g. Elden Ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Genre / Classification</label>
                  <input
                    type="text"
                    required
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                    placeholder="e.g. Action RPG"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Publisher / Developer</label>
                  <input
                    type="text"
                    required
                    value={newDev}
                    onChange={(e) => setNewDev(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
                    placeholder="e.g. FromSoftware"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">File Size (GB)</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={newSize}
                    onChange={(e) => setNewSize(parseInt(e.target.value) || 50)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono font-display">Thumbnail Image URL</label>
                  <input
                    type="url"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none bg-slate-50"
                    placeholder="Optional Unsplash direct link"
                  />
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
                  Confirm Installation
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
