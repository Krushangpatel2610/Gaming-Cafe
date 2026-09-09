import React from "react";
import {
  Gamepad2,
  Wallet,
  Sparkles,
  Bell,
  RefreshCw,
  LogOut,
  Zap,
  ChevronRight,
  QrCode
} from "lucide-react";
import { ApiUser, ApiUserActiveSession } from "../../api/types";

interface GamerHeaderProps {
  user: ApiUser | null;
  loungeName: string;
  balance: number;
  loyaltyPoints: number;
  activeSession: ApiUserActiveSession | null;
  onOpenTopUp: () => void;
  onOpenUnlock: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
  onRefresh: () => void;
  refreshing: boolean;
  onLogout: () => void;
  onSelectTab: (tab: string) => void;
}

export default function GamerHeader({
  user,
  loungeName,
  balance,
  loyaltyPoints,
  activeSession,
  onOpenTopUp,
  onOpenUnlock,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onRefresh,
  refreshing,
  onLogout,
  onSelectTab
}: GamerHeaderProps) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "GX";

  const getRank = (pts: number) => {
    if (pts >= 1500) return { title: "DIAMOND", text: "text-cyan-400" };
    if (pts >= 800) return { title: "PLATINUM", text: "text-purple-400" };
    if (pts >= 300) return { title: "GOLD", text: "text-amber-400" };
    return { title: "SILVER", text: "text-slate-300" };
  };

  const rank = getRank(loyaltyPoints);

  return (
    <header className="sticky top-0 z-30 bg-[#090d16]/95 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Lounge status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide font-display">
                {loungeName || "10x10 Gaming"}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span>PLAYER HQ</span>
              <span className="text-slate-600">/</span>
              <span className="text-indigo-400 font-semibold">{rank.title} TIER</span>
            </p>
          </div>
        </div>

        {/* Center: Active Session Mini Ticker HUD (if playing) */}
        {activeSession && (
          <button
            onClick={() => onSelectTab("command")}
            className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 transition-all text-left shadow-lg shadow-emerald-950/40 group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-white font-mono">
                <span>{activeSession.systemName}</span>
                <span className="text-emerald-400">#{activeSession.stationNumber}</span>
              </div>
              <p className="text-[10px] text-emerald-400/90 font-mono">
                {activeSession.timeRemainingMinutes}m left
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400/60 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Right Actions: Quick Station Unlock, Wallet Balance, Points, Notifications, Profile */}
        <div className="flex items-center gap-2.5">
          {/* Quick Station Unlock Button */}
          <button
            onClick={onOpenUnlock}
            title="Scan QR or Enter Token to Unlock PC"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-xs font-semibold font-mono transition-all shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-400" />
            <span>CONNECT PC</span>
          </button>

          {/* Credits Balance Chip with 1-click Top Up */}
          <button
            onClick={onOpenTopUp}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/[0.08] hover:border-indigo-500/30 transition-all text-left group"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/25 transition-colors">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <p className="text-[9px] font-mono text-slate-400 leading-none">CREDITS</p>
              <p className="text-xs font-bold text-white font-mono mt-0.5">
                ₹{balance.toFixed(2)}
              </p>
            </div>
            <span className="hidden sm:inline-flex w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 items-center justify-center text-[10px] font-bold group-hover:bg-indigo-500 group-hover:text-white transition-all">
              +
            </span>
          </button>

          {/* Loyalty Points Chip */}
          <button
            onClick={() => onSelectTab("wallet")}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/[0.08] hover:border-amber-500/30 transition-all text-left"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <p className="text-[9px] font-mono text-slate-400 leading-none">POINTS</p>
              <p className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                {loyaltyPoints}
              </p>
            </div>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            title="Notifications"
            className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/[0.08] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[9px] font-bold text-white shadow-lg shadow-pink-500/50">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh Live Data"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/[0.08] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
          </button>

          {/* User profile avatar & sign out */}
          <div className="flex items-center gap-2 pl-1 border-l border-white/10">
            <div
              title={user?.name || "Gamer"}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-600/20"
            >
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-[11px] font-bold text-indigo-300 font-mono">
                {initials}
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
