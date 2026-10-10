import { formatCurrency, currencySymbol } from '../lib/currency';
import React from "react";
import { motion } from "motion/react";
import { 
  Play, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Monitor,
  Trophy,
  Gamepad2,
  TrendingUp,
  Clock
} from "lucide-react";
import { PC, Session, PCStatus } from "../types";
import { ApiCustomer, ApiGame } from "../api/types";
import { getTodayRevenueAnalytics, TodayRevenueData } from "../api/analytics";

interface DashboardViewProps {
  currency: string;
  storeId?: string | null;
  pcs: PC[];
  customers: ApiCustomer[];
  sessions: Session[];
  games: ApiGame[];
  setActiveTab: (tab: string) => void;
  onQuickStartSession: () => void;
  onQuickRegisterCustomer: () => void;
}

export default function DashboardView({ currency, storeId, pcs, 
  customers, 
  sessions, 
  games, 
  setActiveTab,
  onQuickStartSession,
  onQuickRegisterCustomer
}: DashboardViewProps) {
  const [revenueData, setRevenueData] = React.useState<TodayRevenueData | null>(null);
  const [revenueViewIndex, setRevenueViewIndex] = React.useState<number>(0);
  const [isRevenueHovered, setIsRevenueHovered] = React.useState<boolean>(false);

  // Auto-rotate revenue card every 5 seconds (paused on hover)
  React.useEffect(() => {
    if (isRevenueHovered) return;
    const interval = setInterval(() => {
      setRevenueViewIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, [isRevenueHovered]);

  // Fetch today & all-time revenue breakdown
  React.useEffect(() => {
    if (!storeId) return;
    let mounted = true;
    const loadRevenue = async () => {
      try {
        const data = await getTodayRevenueAnalytics(storeId);
        if (mounted) setRevenueData(data);
      } catch (err) {
        console.warn("Failed to load today revenue analytics:", err);
      }
    };
    loadRevenue();
    const timer = setInterval(loadRevenue, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [storeId]);

  // Computations
  const totalActiveSessions = sessions.filter(s => s.status === "Active").length;

  const activeMembersCount = pcs.filter(pc => pc.status === PCStatus.IN_USE && pc.currentUser).length;
  const maintenanceCount = pcs.filter(pc => pc.status === PCStatus.MAINTENANCE).length;

  // Active PC list
  const activePCList = pcs.filter(pc => pc.status === PCStatus.IN_USE);

  // Group PCs by group for quick breakdown
  const groupCounts = pcs.reduce((acc, pc) => {
    acc[pc.group] = (acc[pc.group] || 0) + (pc.status === PCStatus.IN_USE ? 1 : 0);
    return acc;
  }, {} as Record<string, number>);

  const groupTotals = pcs.reduce((acc, pc) => {
    acc[pc.group] = (acc[pc.group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // No real launch-count data exists on the backend (that was invented in
  // the old mock) — this just surfaces active catalog entries instead.
  const activeCatalogGames = games.filter(g => g.isActive).slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-2xl border border-slate-700/30 text-white shadow-xl shadow-slate-900/10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-display mb-1.5">
            Lounge Administrator Workspace
          </h2>
          <p className="text-sm text-slate-300">
            Monitor real-time system performance, manage gaming sessions, and audit logs.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3 shrink-0">
          <button 
            onClick={onQuickStartSession}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all flex items-center space-x-1.5"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Quick Session</span>
          </button>
          <button 
            onClick={onQuickRegisterCustomer}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-semibold border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <Users className="w-4 h-4" />
            <span>New Member</span>
          </button>
        </div>
      </div>

      {/* Grid of Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Active Sessions */}
        <div
          onClick={() => setActiveTab("sessions")}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision hover:border-slate-300 hover:shadow-precision-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-wider mb-2">
                Active Sessions
              </p>
              <h3 className="text-2xl font-bold text-slate-900 font-display">
                {totalActiveSessions}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 font-sans">
                PCs actively in use
              </p>
            </div>
            <div className="p-3 rounded-lg border shrink-0 transition-transform duration-150 group-hover:scale-105 text-indigo-600 bg-indigo-50 border-indigo-100">
              <Play className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 2: Rotating Revenue Card (Item 5: Total / Cash vs UPI / Today) */}
        {(() => {
          const allTimeTotal = revenueData?.allTime?.total ?? 0;
          const allTimeCash = revenueData?.allTime?.cash ?? 0;
          const allTimeUpi = revenueData?.allTime?.upi ?? 0;
          const todayTotal = revenueData?.today?.total ?? 0;
          const todayCash = revenueData?.today?.cash ?? 0;
          const todayUpi = revenueData?.today?.upi ?? 0;
          const playTimeBilled = revenueData?.today?.playTimeBilled ?? 0;

          const cashPct = allTimeTotal > 0 ? Math.round((allTimeCash / allTimeTotal) * 100) : 50;
          const upiPct = allTimeTotal > 0 ? 100 - cashPct : 50;

          let cardTitle = "Total Revenue";
          let badgeText = "All-Time";
          let cardValue = `₹${allTimeTotal.toFixed(2)}`;
          let cardSub = `Cash ₹${allTimeCash.toFixed(2)} · UPI ₹${allTimeUpi.toFixed(2)}`;

          if (revenueViewIndex === 1) {
            cardTitle = "Cash vs UPI";
            badgeText = "Split";
            cardValue = `${cashPct}% Cash · ${upiPct}% UPI`;
            cardSub = `₹${allTimeCash.toFixed(2)} Cash / ₹${allTimeUpi.toFixed(2)} UPI`;
          } else if (revenueViewIndex === 2) {
            cardTitle = "Today's Revenue";
            badgeText = "Today";
            cardValue = `₹${todayTotal.toFixed(2)}`;
            cardSub = todayTotal > 0
              ? `Cash ₹${todayCash.toFixed(2)} · UPI ₹${todayUpi.toFixed(2)} · Play: ₹${playTimeBilled.toFixed(2)}`
              : `Nothing received yet today · Play: ₹${playTimeBilled.toFixed(2)}`;
          }

          return (
            <div
              onClick={() => setActiveTab("payments")}
              onMouseEnter={() => setIsRevenueHovered(true)}
              onMouseLeave={() => setIsRevenueHovered(false)}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision hover:border-slate-300 hover:shadow-precision-md transition-all cursor-pointer group flex flex-col justify-between"
              title="Rotating Revenue card (Total / Cash vs UPI / Today). Pauses on hover."
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <p className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-wider">
                      {cardTitle}
                    </p>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800">
                      {badgeText}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 font-display truncate">
                    {cardValue}
                  </h3>

                  {revenueViewIndex === 1 && (
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex my-1.5">
                      <div style={{ width: `${cashPct}%` }} className="bg-emerald-500 h-full" />
                      <div style={{ width: `${upiPct}%` }} className="bg-indigo-500 h-full" />
                    </div>
                  )}

                  <p className="text-xs text-slate-400 mt-1 font-sans truncate">
                    {cardSub}
                  </p>
                </div>
                <div className="p-3 rounded-lg border shrink-0 transition-transform duration-150 group-hover:scale-105 text-emerald-600 bg-emerald-50 border-emerald-100">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              {/* View Dots Pagination */}
              <div
                className="flex items-center space-x-1.5 mt-3 pt-2 border-t border-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                {[
                  { idx: 0, label: "Total Revenue" },
                  { idx: 1, label: "Cash vs UPI" },
                  { idx: 2, label: "Today's Revenue" }
                ].map(({ idx, label }) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRevenueViewIndex(idx)}
                    title={label}
                    className={`h-1.5 rounded-full transition-all ${
                      revenueViewIndex === idx
                        ? "bg-emerald-600 w-4"
                        : "bg-slate-200 hover:bg-slate-300 w-1.5"
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Card 3: Logged-in Members */}
        <div
          onClick={() => setActiveTab("customers")}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision hover:border-slate-300 hover:shadow-precision-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-wider mb-2">
                Logged-in Members
              </p>
              <h3 className="text-2xl font-bold text-slate-900 font-display">
                {activeMembersCount}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 font-sans">
                Identified customers on PCs
              </p>
            </div>
            <div className="p-3 rounded-lg border shrink-0 transition-transform duration-150 group-hover:scale-105 text-purple-600 bg-purple-50 border-purple-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 4: Under Maintenance */}
        <div
          onClick={() => setActiveTab("live_pcs")}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision hover:border-slate-300 hover:shadow-precision-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 font-mono uppercase tracking-wider mb-2">
                Under Maintenance
              </p>
              <h3 className="text-2xl font-bold text-slate-900 font-display">
                {maintenanceCount}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 font-sans">
                Hardware diagnostics pending
              </p>
            </div>
            <div className={`p-3 rounded-lg border shrink-0 transition-transform duration-150 group-hover:scale-105 ${maintenanceCount > 0 ? "text-amber-600 bg-amber-50 border-amber-100" : "text-slate-400 bg-slate-50 border-slate-100"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Core Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: PC Occupancy & Live Overview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active PCs Miniature Map Grid */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-sm font-bold text-slate-800 font-display">Lounge Status</h4>
                <p className="text-xs text-slate-400">Click Live PCs in sidebar for hardware specs or session extension</p>
              </div>
              <button 
                onClick={() => setActiveTab("live_pcs")}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                View Detailed Grid →
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {pcs.map((pc) => {
                let statusColor = "bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200"; // Available
                if (pc.status === PCStatus.IN_USE) {
                  statusColor = "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10 hover:bg-indigo-700 border-indigo-700";
                } else if (pc.status === PCStatus.MAINTENANCE) {
                  statusColor = "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200";
                } else if (pc.status === PCStatus.OFFLINE) {
                  statusColor = "bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-950";
                }

                return (
                  <div
                    key={pc.id}
                    title={`${pc.name} - ${pc.status}`}
                    onClick={() => setActiveTab("live_pcs")}
                    className={`aspect-square rounded-lg border text-[10px] font-bold font-mono flex flex-col items-center justify-center cursor-pointer transition-all ${statusColor}`}
                  >
                    <Monitor className="w-3.5 h-3.5 mb-1 opacity-80" />
                    <span className="max-w-full text-center line-clamp-2 leading-tight break-words font-sans text-[10px]">
                      {pc.name?.trim() || (pc.stationNumber ? `Station ${pc.stationNumber}` : (pc.id.includes("-") ? pc.id.split("-")[1].toUpperCase() : pc.id))}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block" />
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
                <span>Active Session</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200 inline-block" />
                <span>Maintenance</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-slate-900 inline-block" />
                <span>Offline</span>
              </div>
            </div>
          </div>

          {/* Active Sessions List Widget */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800 font-display">Active Users & Remaining Time</h4>
                <p className="text-xs text-slate-400">Manage running systems currently in play</p>
              </div>
              <button 
                onClick={() => setActiveTab("sessions")}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                All Sessions →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold font-mono uppercase tracking-wider text-[10px]">
                    <th className="py-3">Terminal</th>
                    <th className="py-3">Gamer Name</th>
                    <th className="py-3">Start Time</th>
                    <th className="py-3">Remaining Time</th>
                    <th className="py-3 text-right">Running Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activePCList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No active play sessions currently. Use Quick Session to kickstart.
                      </td>
                    </tr>
                  ) : (
                    activePCList.map((pc) => {
                      const formatTime = (secs?: number) => {
                        if (secs === undefined) return "Unlimited / Infinite";
                        const h = Math.floor(secs / 3600);
                        const m = Math.floor((secs % 3600) / 60);
                        return `${h}h ${m}m remaining`;
                      };
                      const activeSession = sessions.find(s => s.pcId === pc.id && s.status === "Active");

                      return (
                        <tr key={pc.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 font-bold font-mono text-indigo-600">{pc.name.split(" ")[0]}</td>
                          <td className="py-3.5 font-semibold text-slate-700">{pc.currentUser || "Guest User"}</td>
                          <td className="py-3.5 text-slate-500 font-mono">
                            {activeSession ? new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </td>
                          <td className="py-3.5 font-semibold">
                            <span className={`inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full ${
                              pc.timeRemaining && pc.timeRemaining < 900
                                ? "bg-red-50 text-red-700 border border-red-100 animate-pulse"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-100/50"
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(pc.timeRemaining)}</span>
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-bold text-slate-900 font-mono">
                            {formatCurrency((activeSession?.totalCost ?? 0).toFixed(2), currency)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Game stats & Zone breakdown */}
        <div className="space-y-6">
          
          {/* Hardware Zone Occupancy Bar graphs */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
            <h4 className="text-sm font-bold text-slate-800 font-display mb-4">Occupancy by Zone</h4>
            <div className="space-y-4">
              {[
                { name: "VIP Lounge", code: "VIP", count: groupCounts["VIP Zone"] || 0, total: groupTotals["VIP Zone"] || 1, color: "bg-indigo-600" },
                { name: "Standard Arena", code: "STANDARD", count: groupCounts["Standard Zone"] || 0, total: groupTotals["Standard Zone"] || 1, color: "bg-slate-700" },
                { name: "Streaming Booths", code: "STREAMING", count: groupCounts["Streaming Booth"] || 0, total: groupTotals["Streaming Booth"] || 1, color: "bg-purple-600" },
                { name: "Console Deck", code: "CONSOLE", count: groupCounts["Console Lounge"] || 0, total: groupTotals["Console Lounge"] || 1, color: "bg-emerald-600" }
              ].map((zone) => {
                const percent = Math.round((zone.count / zone.total) * 100);
                return (
                  <div key={zone.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{zone.name}</span>
                      <span className="text-slate-500 font-mono">{zone.count}/{zone.total} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${zone.color}`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Games Widget */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-800 font-display">Active Game Catalog</h4>
              <button
                onClick={() => setActiveTab("games")}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Library →
              </button>
            </div>
            <div className="space-y-4">
              {activeCatalogGames.length === 0 ? (
                <p className="text-xs text-slate-400">No active games in the catalog yet.</p>
              ) : (
                activeCatalogGames.map((game) => (
                  <div key={game.id} className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <Gamepad2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{game.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{game.genre || "Uncategorized"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
