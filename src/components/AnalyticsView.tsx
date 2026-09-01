import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, Users, Activity, Monitor, CalendarRange } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import {
  getRevenueAnalytics,
  getUtilizationAnalytics,
  getSessionStatsAnalytics,
  getPlayerAnalytics,
  getSystemPerformanceAnalytics,
} from "../api/analytics";
import {
  ApiPlayerAnalytics,
  ApiRevenueAnalyticsRow,
  ApiSessionStatsAnalytics,
  ApiSystemPerformanceRow,
  ApiHourlySummaryRow,
} from "../api/types";

interface AnalyticsViewProps {
  onNotify: (message: string, severity: "info" | "success" | "danger" | "warning") => void;
}

function toDateInputValue(d: Date): string {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export default function AnalyticsView({ onNotify }: AnalyticsViewProps) {
  const { storeId } = useAuth();
  const [dateFrom, setDateFrom] = useState<string>(toDateInputValue(new Date(Date.now() - 6 * 86400000)));
  const [dateTo, setDateTo] = useState<string>(toDateInputValue(new Date()));

  const [revenue, setRevenue] = useState<ApiRevenueAnalyticsRow[]>([]);
  const [utilization, setUtilization] = useState<ApiHourlySummaryRow[]>([]);
  const [sessionStats, setSessionStats] = useState<ApiSessionStatsAnalytics | null>(null);
  const [players, setPlayers] = useState<ApiPlayerAnalytics | null>(null);
  const [systems, setSystems] = useState<ApiSystemPerformanceRow[]>([]);

  const refresh = async () => {
    if (!storeId) return;
    const params = { dateFrom: `${dateFrom}T00:00:00.000Z`, dateTo: `${dateTo}T23:59:59.999Z` };
    try {
      const [rev, util, stats, pl, sys] = await Promise.all([
        getRevenueAnalytics(storeId, { dateFrom, dateTo, groupBy: "day" }),
        getUtilizationAnalytics(storeId, params),
        getSessionStatsAnalytics(storeId, params),
        getPlayerAnalytics(storeId, params),
        getSystemPerformanceAnalytics(storeId, params),
      ]);
      setRevenue(rev.data);
      setUtilization(util.data);
      setSessionStats(stats);
      setPlayers(pl);
      setSystems(sys.systems);
    } catch (err) {
      onNotify(`Failed to load analytics: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, dateFrom, dateTo]);

  const maxRevenue = useMemo(() => Math.max(1, ...revenue.map((r) => parseFloat(r.revenue))), [revenue]);

  const heatmapByDayHour = useMemo(() => {
    const map = new Map<string, number>();
    let max = 1;
    for (const row of utilization) {
      const key = `${row.summaryDate}-${row.hourOfDay}`;
      const value = row.totalSystems > 0 ? row.systemsInUse / row.totalSystems : 0;
      map.set(key, value);
      if (value > max) max = value;
    }
    return { map, max };
  }, [utilization]);

  const days = useMemo(() => Array.from(new Set(utilization.map((r) => r.summaryDate))).sort(), [utilization]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">Revenue, utilization, and player insights over your selected date range.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg border border-slate-200 p-1.5">
          <CalendarRange className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-xs bg-transparent focus:outline-none font-mono" />
          <span className="text-slate-300">—</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-xs bg-transparent focus:outline-none font-mono" />
        </div>
      </div>

      {/* Session & player stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-precision">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono uppercase mb-2"><Activity className="w-3.5 h-3.5" />Sessions</div>
          <p className="text-xl font-bold text-slate-900 font-mono">{sessionStats?.totalSessions ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">{sessionStats?.walkInCount ?? 0} walk-in · {sessionStats?.bookingCount ?? 0} booked</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-precision">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono uppercase mb-2"><TrendingUp className="w-3.5 h-3.5" />Avg Duration</div>
          <p className="text-xl font-bold text-slate-900 font-mono">{sessionStats ? parseFloat(sessionStats.avgDurationMinutes).toFixed(0) : 0}m</p>
          <p className="text-[10px] text-slate-400 mt-1">{sessionStats?.completed ?? 0} completed</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-precision">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono uppercase mb-2"><Users className="w-3.5 h-3.5" />Unique Players</div>
          <p className="text-xl font-bold text-slate-900 font-mono">{players?.uniquePlayers ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">{players?.newPlayers ?? 0} new · {players?.returningPlayers ?? 0} returning</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-precision">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono uppercase mb-2"><Monitor className="w-3.5 h-3.5" />Top Player</div>
          <p className="text-xl font-bold text-slate-900 font-mono">{players ? (players.topPlayerMinutes / 60).toFixed(1) : 0}h</p>
          <p className="text-[10px] text-slate-400 mt-1">longest play time in range</p>
        </div>
      </div>

      {/* Revenue bar chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <h3 className="text-sm font-bold text-slate-800 font-display mb-4">Revenue by Day</h3>
        {revenue.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No revenue data for this range.</p>
        ) : (
          <div className="flex items-end gap-2 h-48">
            {revenue.map((r) => (
              <div key={r.date} className="flex-1 flex flex-col items-center justify-end gap-1.5 group relative">
                <span className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">₹{parseFloat(r.netRevenue).toFixed(0)}</span>
                <div
                  className="w-full bg-indigo-500 rounded-t-md hover:bg-indigo-600 transition-colors"
                  style={{ height: `${Math.max((parseFloat(r.revenue) / maxRevenue) * 160, 3)}px` }}
                />
                <span className="text-[9px] font-mono text-slate-400">{new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Utilization heatmap */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision overflow-x-auto">
        <h3 className="text-sm font-bold text-slate-800 font-display mb-4">Utilization Heatmap</h3>
        {days.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No utilization data for this range.</p>
        ) : (
          <div className="min-w-max">
            <div className="flex gap-0.5 pl-14">
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="w-5 text-center text-[8px] font-mono text-slate-300">{h}</div>
              ))}
            </div>
            {days.map((day) => (
              <div key={day} className="flex items-center gap-0.5">
                <span className="w-14 text-[9px] font-mono text-slate-400 shrink-0">{new Date(day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                {Array.from({ length: 24 }).map((_, h) => {
                  const value = heatmapByDayHour.map.get(`${day}-${h}`) ?? 0;
                  const intensity = value / heatmapByDayHour.max;
                  return (
                    <div
                      key={h}
                      title={`${Math.round(value * 100)}% utilized`}
                      className="w-5 h-5 rounded-sm"
                      style={{ backgroundColor: intensity > 0 ? `rgba(99, 102, 241, ${Math.max(intensity, 0.08)})` : "#f1f5f9" }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System performance table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden">
        <div className="p-4 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-800 font-display">System Performance</h3></div>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="text-left px-4 py-3">Terminal</th>
              <th className="text-left px-4 py-3">Platform</th>
              <th className="text-left px-4 py-3">Sessions</th>
              <th className="text-left px-4 py-3">Minutes</th>
              <th className="text-left px-4 py-3">Revenue</th>
              <th className="text-left px-4 py-3">Utilization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {systems.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">No system data for this range.</td></tr>
            ) : (
              systems.map((s) => (
                <tr key={s.systemId} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-700">{s.name}</td>
                  <td className="px-4 py-3 uppercase text-slate-500">{s.platform}</td>
                  <td className="px-4 py-3 text-slate-600">{s.totalSessions}</td>
                  <td className="px-4 py-3 text-slate-600">{s.totalMinutes}m</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">₹{parseFloat(s.totalRevenue).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${Math.min(parseFloat(s.utilizationRate), 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{parseFloat(s.utilizationRate).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
