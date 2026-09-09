import React, { useState, useMemo } from "react";
import {
  Gamepad2,
  Search,
  Monitor,
  Calendar,
  Sparkles,
  Trophy,
  Filter,
  Play
} from "lucide-react";
import { ApiAvailableSystem, ApiGame } from "../../api/types";

interface GamerGameVaultViewProps {
  systems: ApiAvailableSystem[];
  onOpenBooking: (system?: ApiAvailableSystem) => void;
}

export default function GamerGameVaultView({
  systems,
  onOpenBooking
}: GamerGameVaultViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");

  // Aggregate all unique games installed across available systems
  const aggregatedGames = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        genre: string | null;
        installedSystems: ApiAvailableSystem[];
      }
    >();

    systems.forEach((sys) => {
      sys.games.forEach((g) => {
        if (!map.has(g.id)) {
          map.set(g.id, {
            id: g.id,
            name: g.name,
            genre: g.genre,
            installedSystems: [sys]
          });
        } else {
          map.get(g.id)!.installedSystems.push(sys);
        }
      });
    });

    // Fallback if cafe hasn't populated games on systems yet
    if (map.size === 0) {
      const defaultTitles = [
        { id: "g-1", name: "Valorant", genre: "Tactical FPS" },
        { id: "g-2", name: "Counter-Strike 2", genre: "Competitive FPS" },
        { id: "g-3", name: "Cyberpunk 2077: Phantom Liberty", genre: "Action RPG" },
        { id: "g-4", name: "Apex Legends", genre: "Battle Royale" },
        { id: "g-5", name: "Dota 2", genre: "MOBA" },
        { id: "g-6", name: "Grand Theft Auto V", genre: "Open World" },
        { id: "g-7", name: "EA SPORTS FC 25", genre: "Sports" },
        { id: "g-8", name: "Forza Horizon 5", genre: "Racing" }
      ];

      defaultTitles.forEach((dt) => {
        map.set(dt.id, {
          id: dt.id,
          name: dt.name,
          genre: dt.genre,
          installedSystems: systems.slice(0, 3)
        });
      });
    }

    return Array.from(map.values());
  }, [systems]);

  const genres = useMemo(() => {
    const set = new Set<string>();
    aggregatedGames.forEach((g) => {
      if (g.genre) set.add(g.genre);
    });
    return ["all", ...Array.from(set)];
  }, [aggregatedGames]);

  const filteredGames = useMemo(() => {
    return aggregatedGames.filter((g) => {
      const matchesGenre =
        selectedGenre === "all" || (g.genre && g.genre.toLowerCase() === selectedGenre.toLowerCase());
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        g.name.toLowerCase().includes(q) ||
        (g.genre && g.genre.toLowerCase().includes(q));
      return matchesGenre && matchesQuery;
    });
  }, [aggregatedGames, selectedGenre, searchQuery]);

  // Color generator for game artwork cards
  const getGradient = (index: number) => {
    const gradients = [
      "from-indigo-600/30 via-purple-600/20 to-slate-900",
      "from-rose-600/30 via-pink-600/20 to-slate-900",
      "from-cyan-600/30 via-blue-600/20 to-slate-900",
      "from-amber-600/30 via-orange-600/20 to-slate-900",
      "from-emerald-600/30 via-teal-600/20 to-slate-900"
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-display tracking-tight flex items-center gap-2.5">
            <Gamepad2 className="w-6 h-6 text-indigo-400" />
            <span>Game Vault & Library</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Search pre-installed titles and instantly discover which gaming rigs have them ready to play
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-white/[0.08]">
          {aggregatedGames.length} Titles in Lounge Library
        </div>
      </div>

      {/* Search & Genre Filters */}
      <div className="p-4 rounded-2xl bg-[#0d121f] border border-white/[0.08] space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search game titles or genres (e.g. Valorant, RPG, Racing)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1 border-t border-white/[0.04]">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all capitalize ${
                selectedGenre === genre
                  ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              {genre === "all" ? "All Genres" : genre}
            </button>
          ))}
        </div>
      </div>

      {/* Games Catalog Grid */}
      {filteredGames.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#0d121f] border border-white/[0.08] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 mx-auto flex items-center justify-center text-slate-600">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white font-mono">No Games Found</h4>
          <p className="text-xs text-slate-400">
            Try adjusting your search query or selecting "All Genres".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGames.map((game, i) => {
            const firstAvailable = game.installedSystems.find((s) => s.platform === "pc") || game.installedSystems[0];

            return (
              <div
                key={game.id}
                className="rounded-3xl bg-[#0d121f] border border-white/[0.08] hover:border-indigo-500/40 p-5 shadow-xl transition-all duration-200 flex flex-col justify-between group overflow-hidden relative"
              >
                {/* Visual Header Banner */}
                <div
                  className={`h-24 -mx-5 -mt-5 p-4 rounded-t-3xl bg-gradient-to-br ${getGradient(
                    i
                  )} flex items-end justify-between border-b border-white/[0.06] relative overflow-hidden`}
                >
                  <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Gamepad2 className="w-16 h-16 text-white" />
                  </div>

                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm border border-white/10">
                    {game.genre || "Action"}
                  </span>
                </div>

                <div className="pt-4 space-y-3">
                  <h3 className="text-base font-bold text-white font-display tracking-tight group-hover:text-indigo-300 transition-colors">
                    {game.name}
                  </h3>

                  {/* Installed On Station Tags */}
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Monitor className="w-3 h-3 text-indigo-400" />
                      <span>Ready on {game.installedSystems.length} Stations</span>
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {game.installedSystems.slice(0, 4).map((s) => (
                        <span
                          key={s.id}
                          className="text-[9px] font-mono text-slate-300 bg-slate-900 border border-white/[0.06] px-2 py-0.5 rounded-md"
                        >
                          {s.name}
                        </span>
                      ))}
                      {game.installedSystems.length > 4 && (
                        <span className="text-[9px] font-mono text-slate-500 px-1 py-0.5">
                          +{game.installedSystems.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Action */}
                <div className="mt-6 pt-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => onOpenBooking(firstAvailable)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-600/25"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play on Station</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
