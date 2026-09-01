import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Gamepad2,
  Wallet,
  Monitor,
  Clock,
  Trophy,
  LogOut,
  RefreshCw,
  AlertCircle,
  Loader2,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUserDashboard } from "../api/user";
import { listAvailableSystems } from "../api/systems";
import { ApiUserDashboard, ApiAvailableSystem } from "../api/types";
import { ApiError } from "../api/client";

export default function UserDashboardView() {
  const { user, userStoreId, userLogout } = useAuth();

  const [dashboard, setDashboard] = useState<ApiUserDashboard | null>(null);
  const [systems, setSystems] = useState<ApiAvailableSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!userStoreId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [dash, avail] = await Promise.all([
        getUserDashboard(userStoreId),
        listAvailableSystems(userStoreId),
      ]);
      setDashboard(dash);
      setSystems(avail);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load your dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userStoreId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  const available = parseFloat(dashboard?.balance.available ?? "0");
  const current = parseFloat(dashboard?.balance.current ?? "0");
  const session = dashboard?.activeSession ?? null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">GameCentral</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={userLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Welcome */}
        <div>
          <p className="text-slate-400 text-xs">Welcome back,</p>
          <h1 className="text-xl font-bold mt-0.5">{user?.name ?? "Player"}</h1>
        </div>

        {/* Credits card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-12 -left-6 w-40 h-40 bg-white/5 rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold">
              <Wallet className="w-3.5 h-3.5" />
              CREDITS
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold">₹{available.toFixed(2)}</p>
              <p className="text-indigo-200 text-xs mt-1">Available balance</p>
            </div>
            {Math.abs(current - available) > 0.01 && (
              <p className="text-indigo-300 text-[10px] mt-2">
                Total balance: ₹{current.toFixed(2)}
              </p>
            )}
          </div>
        </motion.div>

        {/* Active session */}
        {session && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-3">
              <Zap className="w-3.5 h-3.5" />
              ACTIVE SESSION
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-emerald-300 text-base">{session.systemName}</p>
                <p className="text-slate-400 text-xs mt-0.5">Station #{session.stationNumber}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-2xl text-emerald-300">{session.timeRemainingMinutes}</p>
                <p className="text-slate-400 text-[10px]">minutes left</p>
              </div>
            </div>
            {session.timeRemainingMinutes <= 10 && (
              <div className="mt-3 text-xs text-amber-400 font-semibold">
                ⚠ Low time — top up your credits to continue
              </div>
            )}
          </motion.div>
        )}

        {/* Most played games */}
        {(dashboard?.mostPlayedGames ?? []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-4">
              <Trophy className="w-3.5 h-3.5" />
              MOST PLAYED GAMES
            </div>
            <div className="space-y-2.5">
              {dashboard!.mostPlayedGames.map((g, i) => (
                <div key={g.id} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-600 w-4 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{g.name}</p>
                    {g.genre && <p className="text-[10px] text-slate-500">{g.genre}</p>}
                  </div>
                  <span className="text-xs text-slate-400 font-mono shrink-0">
                    {g.playCount}×
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Available systems */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-3">
            <Monitor className="w-3.5 h-3.5" />
            AVAILABLE TERMINALS
            <span className="ml-auto text-slate-600">{systems.length} free</span>
          </div>

          {systems.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-6 text-center text-slate-500 text-xs">
              All terminals are currently occupied. Check back soon.
            </div>
          ) : (
            <div className="space-y-2">
              {systems.map((s) => (
                <div key={s.id} className="bg-white/5 hover:bg-white/8 rounded-xl p-4 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-white">{s.name}</p>
                        <span className="text-[10px] text-slate-500 font-mono">#{s.stationNumber}</span>
                        <span className="text-[10px] uppercase text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded font-mono">
                          {s.platform}
                        </span>
                      </div>
                      {s.games.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {s.games.slice(0, 5).map((g) => (
                            <span
                              key={g.id}
                              className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded"
                            >
                              {g.name}
                            </span>
                          ))}
                          {s.games.length > 5 && (
                            <span className="text-[10px] text-slate-600 px-1">
                              +{s.games.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 text-emerald-400 text-[10px] font-semibold">
                      <Clock className="w-3 h-3" />
                      Free
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
