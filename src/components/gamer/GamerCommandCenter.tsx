import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Gamepad2,
  Wallet,
  Monitor,
  Clock,
  Trophy,
  Zap,
  Sparkles,
  ChevronRight,
  QrCode,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Flame,
  Plus,
  ShieldAlert
} from "lucide-react";
import {
  ApiUser,
  ApiUserDashboard,
  ApiAvailableSystem,
  ApiCampaign,
  ApiSystemType
} from "../../api/types";
import { extendSession } from "../../api/sessions";

interface GamerCommandCenterProps {
  user: ApiUser | null;
  dashboard: ApiUserDashboard | null;
  systems: ApiAvailableSystem[];
  systemTypes: ApiSystemType[];
  loyaltyBalance: number;
  activeCampaigns: ApiCampaign[];
  storeId: string;
  onOpenBooking: (system?: ApiAvailableSystem) => void;
  onOpenUnlock: () => void;
  onOpenTopUp: () => void;
  onSelectTab: (tab: string) => void;
  onRefresh: () => void;
}

export default function GamerCommandCenter({
  user,
  dashboard,
  systems,
  systemTypes,
  loyaltyBalance,
  activeCampaigns,
  storeId,
  onOpenBooking,
  onOpenUnlock,
  onOpenTopUp,
  onSelectTab,
  onRefresh
}: GamerCommandCenterProps) {
  const [extending, setExtending] = useState<boolean>(false);
  const [extendMessage, setExtendMessage] = useState<string | null>(null);

  const availableCredits = parseFloat(dashboard?.balance.available ?? "0");
  const currentCredits = parseFloat(dashboard?.balance.current ?? "0");
  const session = dashboard?.activeSession ?? null;
  const mostPlayed = dashboard?.mostPlayedGames ?? [];

  // Gamer Rank Tier Calculation
  const getRank = (pts: number) => {
    if (pts >= 1500) {
      return { title: "DIAMOND", level: 18, color: "from-cyan-500 to-blue-600", nextPts: 2500, perk: "15% Bonus Credits" };
    }
    if (pts >= 800) {
      return { title: "PLATINUM", level: 12, color: "from-purple-500 to-pink-600", nextPts: 1500, perk: "10% Bonus Credits" };
    }
    if (pts >= 300) {
      return { title: "GOLD", level: 7, color: "from-amber-500 to-yellow-600", nextPts: 800, perk: "5% Bonus Credits" };
    }
    return { title: "SILVER", level: 3, color: "from-slate-400 to-slate-600", nextPts: 300, perk: "Base Loyalty Rate" };
  };

  const rank = getRank(loyaltyBalance);
  const xpProgress = Math.min(100, Math.round((loyaltyBalance / rank.nextPts) * 100));

  const handleExtendActiveSession = async (mins: number) => {
    if (!session || !storeId || extending) return;
    setExtending(true);
    setExtendMessage(null);
    try {
      await extendSession(storeId, session.sessionId, mins);
      setExtendMessage(`Extended by +${mins} minutes!`);
      setTimeout(() => {
        onRefresh();
        setExtendMessage(null);
      }, 1500);
    } catch {
      setExtendMessage("Could not extend session automatically. Please check credits.");
    } finally {
      setExtending(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Gamer Hero Banner ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1326] via-[#121a36] to-[#0d1326] border border-white/[0.08] p-6 sm:p-8 shadow-2xl shadow-black/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-300">
                ⭐ {rank.title} TIER · LVL {rank.level}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE GAMER
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">{user?.name || "Player"}</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-xl leading-relaxed">
              Your esports headquarters. Book high-refresh RTX rigs, unlock PCs via screen codes, manage your wallet credits, and redeem loyalty rewards.
            </p>

            {/* XP Progress to Next Tier */}
            <div className="pt-2 max-w-md space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>XP Progress to Next Perk</span>
                <span className="text-indigo-300 font-bold">{loyaltyBalance} / {rank.nextPts} pts</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 border border-white/[0.08] overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Current Perk: {rank.perk}</p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={onOpenUnlock}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition-all group"
            >
              <QrCode className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
              <span>CONNECT / UNLOCK PC</span>
            </button>

            <button
              onClick={() => onOpenBooking()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/25 transition-all group"
            >
              <Calendar className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
              <span>RESERVE A RIG</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── LIVE ACTIVE SESSION HUD (If In Session) ────────────────────────── */}
      {session && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1824] via-[#0f2133] to-[#0c1824] border border-emerald-500/40 p-6 sm:p-7 shadow-2xl shadow-emerald-950/60"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Zap className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>LIVE SESSION ACTIVE</span>
              </div>

              <div className="flex items-baseline gap-3">
                <h3 className="text-2xl font-bold text-white font-display">
                  {session.systemName}
                </h3>
                <span className="text-sm font-mono text-emerald-400 font-semibold">
                  Station #{session.stationNumber}
                </span>
              </div>

              <p className="text-xs text-slate-400 font-mono">
                Started at {new Date(session.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>

              {session.timeRemainingMinutes <= 15 && (
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Time running low! Top up your credits to auto-extend.</span>
                </div>
              )}

              {extendMessage && (
                <p className="text-xs font-mono text-emerald-300">{extendMessage}</p>
              )}
            </div>

            {/* Real-time Countdown Display & Quick Extend */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="text-left sm:text-right bg-black/40 px-6 py-4 rounded-2xl border border-emerald-500/30">
                <p className="text-3xl sm:text-4xl font-mono font-extrabold text-emerald-400 tracking-tight">
                  {session.timeRemainingMinutes}m
                </p>
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">
                  Remaining Playtime
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Quick Extend:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExtendActiveSession(30)}
                    disabled={extending}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold transition-all disabled:opacity-50"
                  >
                    +30m
                  </button>
                  <button
                    onClick={() => handleExtendActiveSession(60)}
                    disabled={extending}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold transition-all disabled:opacity-50"
                  >
                    +60m
                  </button>
                  <button
                    onClick={onOpenTopUp}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold transition-all"
                  >
                    Add Credits
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Key Metrics Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Credits Card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#101426] to-[#0b0e1b] border border-white/[0.08] p-5 relative overflow-hidden shadow-xl group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Available Credits
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-3">
            ₹{availableCredits.toFixed(2)}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06] text-[11px] font-mono">
            <span className="text-slate-400">Total Balance</span>
            <button
              onClick={onOpenTopUp}
              className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
            >
              <span>+ Top Up</span>
            </button>
          </div>
        </div>

        {/* Loyalty Points Card */}
        <button
          onClick={() => onSelectTab("wallet")}
          className="rounded-2xl bg-gradient-to-br from-[#101426] to-[#0b0e1b] border border-white/[0.08] p-5 relative overflow-hidden shadow-xl text-left group hover:border-amber-500/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Loyalty Points
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-3">
            {loyaltyBalance} <span className="text-xs text-slate-400 font-normal">pts</span>
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-amber-300">
            <span>Redeem Rewards</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Available Stations Glance */}
        <button
          onClick={() => onSelectTab("stations")}
          className="rounded-2xl bg-gradient-to-br from-[#101426] to-[#0b0e1b] border border-white/[0.08] p-5 relative overflow-hidden shadow-xl text-left group hover:border-emerald-500/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Free Stations Now
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Monitor className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-3">
            {systems.length} <span className="text-xs text-slate-400 font-normal">open rigs</span>
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-emerald-400">
            <span>Browse & Reserve</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Active Promos / Deals */}
        <button
          onClick={() => onSelectTab("promos")}
          className="rounded-2xl bg-gradient-to-br from-[#101426] to-[#0b0e1b] border border-white/[0.08] p-5 relative overflow-hidden shadow-xl text-left group hover:border-purple-500/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Active Promos
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-3">
            {activeCampaigns.length > 0 ? `${activeCampaigns.length} Deals` : "Happy Hours"}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06] text-[11px] font-mono text-purple-300">
            <span>View Lounge Promos</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* ── Floor Stations Quick Booking Preview ─────────────────────────────── */}
      <div className="rounded-3xl bg-[#0d121f] border border-white/[0.08] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white font-display">
              Stations Ready to Play
            </h3>
            <span className="text-xs font-mono text-slate-400">({systems.length} ready)</span>
          </div>

          <button
            onClick={() => onSelectTab("stations")}
            className="text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View All Rigs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {systems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-white/[0.06] text-slate-400 text-xs font-mono">
            All stations currently occupied or undergoing maintenance. Check back shortly!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {systems.slice(0, 6).map((sys) => {
              const type = systemTypes.find((t) => t.id === sys.systemTypeId);
              const rate = type ? parseFloat(type.hourlyBaseRate) : 120;

              return (
                <div
                  key={sys.id}
                  className="rounded-2xl bg-slate-900/80 border border-white/[0.06] hover:border-indigo-500/30 p-4 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white font-display">
                            {sys.name}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400">
                            #{sys.stationNumber}
                          </span>
                        </div>
                        <span className="inline-block mt-1 text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 font-semibold">
                          {sys.platform}
                        </span>
                      </div>

                      <div className="text-right font-mono">
                        <p className="text-xs font-bold text-white">₹{rate}/hr</p>
                        <span className="text-[9px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Free
                        </span>
                      </div>
                    </div>

                    {/* Installed games chips */}
                    {sys.games && sys.games.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {sys.games.slice(0, 3).map((g) => (
                          <span
                            key={g.id}
                            className="text-[9px] font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md"
                          >
                            {g.name}
                          </span>
                        ))}
                        {sys.games.length > 3 && (
                          <span className="text-[9px] font-mono text-slate-500 px-1 py-0.5">
                            +{sys.games.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <button
                      onClick={() => onOpenBooking(sys)}
                      className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Reserve Station</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Most Played Games & Active Promos Row ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Played Games */}
        <div className="rounded-3xl bg-[#0d121f] border border-white/[0.08] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-display font-bold">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3>Your Most Played Titles</h3>
            </div>
            <button
              onClick={() => onSelectTab("vault")}
              className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Explore Vault</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {mostPlayed.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/60 text-center text-slate-400 text-xs font-mono">
              Start playing on any station to build your personal gaming stats!
            </div>
          ) : (
            <div className="space-y-2.5">
              {mostPlayed.map((game, i) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-white/[0.06] hover:border-indigo-500/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-indigo-400">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white tracking-tight">{game.name}</p>
                      {game.genre && (
                        <p className="text-[10px] text-slate-400 font-mono">{game.genre}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {game.playCount} {game.playCount === 1 ? "Session" : "Sessions"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featured Promotion Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-950/40 via-[#0d121f] to-purple-950/30 border border-indigo-500/30 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4 text-pink-400" />
              <span>LOUNGE PERK OF THE WEEK</span>
            </div>

            <h4 className="text-xl font-bold text-white font-display">
              {activeCampaigns.length > 0 ? activeCampaigns[0].name : "Weekend Esports Rush"}
            </h4>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {activeCampaigns.length > 0 && activeCampaigns[0].description
                ? activeCampaigns[0].description
                : "Top up ₹500 or more to receive complimentary bonus credits and 2x loyalty points on all RTX rigs."}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              Valid until end of month
            </span>
            <button
              onClick={() => onSelectTab("promos")}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-colors shadow-md shadow-indigo-600/30"
            >
              Claim Promo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
