import React from "react";
import {
  LayoutDashboard,
  Monitor,
  CalendarDays,
  Gamepad2,
  Wallet,
  Tag,
  Sparkles,
  Zap,
  ChevronRight
} from "lucide-react";

export type GamerTabId =
  | "command"
  | "stations"
  | "bookings"
  | "vault"
  | "wallet"
  | "promos";

interface GamerNavProps {
  activeTab: GamerTabId;
  onSelectTab: (tab: GamerTabId) => void;
  hasActiveSession?: boolean;
  activeBookingsCount?: number;
}

export default function GamerNav({
  activeTab,
  onSelectTab,
  hasActiveSession = false,
  activeBookingsCount = 0
}: GamerNavProps) {
  const navItems: Array<{
    id: GamerTabId;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number | null;
    badgeColor?: string;
  }> = [
    {
      id: "command",
      label: "Command HQ",
      sublabel: "Overview & Active Session",
      icon: LayoutDashboard,
      badge: hasActiveSession ? "LIVE" : null,
      badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
    },
    {
      id: "stations",
      label: "Stations & Rigs",
      sublabel: "RTX PCs, Consoles & VR",
      icon: Monitor
    },
    {
      id: "bookings",
      label: "My Bookings",
      sublabel: "Reservations & Schedule",
      icon: CalendarDays,
      badge: activeBookingsCount > 0 ? activeBookingsCount : null,
      badgeColor: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
    },
    {
      id: "vault",
      label: "Game Vault",
      sublabel: "Installed Games Catalog",
      icon: Gamepad2
    },
    {
      id: "wallet",
      label: "Wallet & Loyalty",
      sublabel: "Credits & Reward Store",
      icon: Wallet
    },
    {
      id: "promos",
      label: "Deals & Promos",
      sublabel: "Active Discounts & Boosts",
      icon: Tag
    }
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#090d16] border-r border-white/[0.08] min-h-[calc(100vh-65px)] p-4 select-none">
        <div className="space-y-1 flex-1">
          <p className="px-3 py-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono">
            Navigation
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-200 group relative ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-950/70 to-slate-900 text-white font-semibold border border-indigo-500/40 shadow-lg shadow-indigo-950/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                {/* Active glow indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full shadow-lg shadow-indigo-500/50" />
                )}

                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-indigo-600/30 text-indigo-400 shadow-inner"
                      : "bg-slate-900 text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold truncate tracking-tight">{item.label}</p>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.sublabel}</p>
                </div>

                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive
                      ? "text-indigo-400 translate-x-0"
                      : "text-slate-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Bottom Lounge Highlights Card */}
        <div className="mt-6 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/20 shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold font-mono mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VIP REWARDS</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Play 5 hours this week to earn double bonus points.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-white/[0.08] px-2 py-1 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all relative ${
                isActive ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {item.badge && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
              <Icon className="w-4.5 h-4.5" />
              <span className="text-[9px] font-medium tracking-tight mt-1">
                {item.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
