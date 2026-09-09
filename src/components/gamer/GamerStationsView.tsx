import React, { useState, useMemo } from "react";
import {
  Monitor,
  Search,
  Cpu,
  Tv,
  Gamepad2,
  Calendar,
  Zap,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";
import { ApiAvailableSystem, ApiSystemType, ApiSystemPlatform } from "../../api/types";

interface GamerStationsViewProps {
  systems: ApiAvailableSystem[];
  systemTypes: ApiSystemType[];
  onOpenBooking: (system?: ApiAvailableSystem) => void;
  onOpenUnlock: () => void;
}

export default function GamerStationsView({
  systems,
  systemTypes,
  onOpenBooking,
  onOpenUnlock
}: GamerStationsViewProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("all");

  const platforms: Array<{ id: string; label: string }> = [
    { id: "all", label: "All Platforms" },
    { id: "pc", label: "PC (RTX Rigs)" },
    { id: "ps5", label: "PlayStation 5" },
    { id: "xbox", label: "Xbox Series X" },
    { id: "vr", label: "VR Simulators" }
  ];

  const filteredSystems = useMemo(() => {
    return systems.filter((sys) => {
      const matchesPlatform =
        selectedPlatform === "all" || sys.platform.toLowerCase() === selectedPlatform.toLowerCase();

      const matchesType =
        selectedTypeId === "all" || sys.systemTypeId === selectedTypeId;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        sys.name.toLowerCase().includes(q) ||
        sys.stationNumber.toString().includes(q) ||
        sys.games.some((g) => g.name.toLowerCase().includes(q));

      return matchesPlatform && matchesType && matchesSearch;
    });
  }, [systems, selectedPlatform, selectedTypeId, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-display tracking-tight flex items-center gap-2.5">
            <Monitor className="w-6 h-6 text-indigo-400" />
            <span>Gaming Stations & Hardware Rigs</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Browse high-refresh esports setups, consoles, and VR battle stations ready to play
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUnlock}
            className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold transition-all shadow-sm"
          >
            ⚡ Connect to Station
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0d121f] border border-white/[0.08] space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station name, # or installed game (e.g. Valorant, Cyberpunk)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* System Type Filter */}
          {systemTypes.length > 0 && (
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/[0.08] text-white text-xs font-mono focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="all">All Rig Specs</option>
              {systemTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (₹{parseFloat(t.hourlyBaseRate)}/hr)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Platform Chips */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-white/[0.04]">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                selectedPlatform === p.id
                  ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stations Grid */}
      {filteredSystems.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-[#0d121f] border border-white/[0.08] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 mx-auto flex items-center justify-center text-slate-600">
            <Monitor className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white font-mono">No Stations Matched</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try clearing your search query or selecting "All Platforms" to view all terminals.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedPlatform("all");
              setSelectedTypeId("all");
            }}
            className="text-xs font-mono text-indigo-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSystems.map((sys) => {
            const type = systemTypes.find((t) => t.id === sys.systemTypeId);
            const rate = type ? parseFloat(type.hourlyBaseRate) : 120;
            const specs = (sys.specs || (type?.specs as Record<string, unknown>)) || {};
            const gpu = (specs.gpu as string) || "RTX 4070 Ti";
            const cpu = (specs.cpu as string) || "Intel i7 / Ryzen 7";
            const monitor = (specs.monitor as string) || "240Hz Gaming IPS";
            const ram = (specs.ram as string) || "32GB DDR5";

            return (
              <div
                key={sys.id}
                className="rounded-3xl bg-[#0d121f] border border-white/[0.08] hover:border-indigo-500/40 p-5 shadow-xl transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top station info */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white font-display tracking-tight">
                          {sys.name}
                        </h3>
                        <span className="text-xs font-mono text-slate-400">
                          #{sys.stationNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                          {sys.platform}
                        </span>
                        {type && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {type.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <p className="text-sm font-bold text-white">₹{rate}/hr</p>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center justify-end gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Available
                      </span>
                    </div>
                  </div>

                  {/* Hardware Specs Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-2xl bg-slate-900/60 border border-white/[0.04] text-[11px] font-mono">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{gpu}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{cpu}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Tv className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{monitor}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Monitor className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span className="truncate">{ram}</span>
                    </div>
                  </div>

                  {/* Installed Games */}
                  {sys.games && sys.games.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                        Pre-Installed Games ({sys.games.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {sys.games.slice(0, 4).map((g) => (
                          <span
                            key={g.id}
                            className="text-[9px] font-mono text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded-md"
                          >
                            {g.name}
                          </span>
                        ))}
                        {sys.games.length > 4 && (
                          <span className="text-[9px] font-mono text-slate-400 px-1 py-0.5">
                            +{sys.games.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2.5">
                  <button
                    onClick={() => onOpenBooking(sys)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Reserve Slot</span>
                  </button>

                  <button
                    onClick={onOpenUnlock}
                    title="Unlock this PC right now"
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/[0.08] hover:border-emerald-500/40 text-emerald-400 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
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
