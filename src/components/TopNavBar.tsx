import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Search, 
  Monitor, 
  Clock, 
  Sparkles,
  Wifi,
  AlertTriangle,
  Settings
} from "lucide-react";
import { PC, PCStatus, ActivityLog } from "../types";

interface TopNavBarProps {
  pcs: PC[];
  loungeName: string;
  logs: ActivityLog[];
  onSearch: (query: string) => void;
  onClearLogs: () => void;
}

export default function TopNavBar({ pcs, loungeName, logs, onSearch, onClearLogs }: TopNavBarProps) {
  const [timeString, setTimeString] = useState<string>("");
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalPCs = pcs.length;
  const activePCs = pcs.filter(pc => pc.status === PCStatus.IN_USE).length;
  const availablePCs = pcs.filter(pc => pc.status === PCStatus.AVAILABLE).length;
  const occupancyPercentage = totalPCs > 0 ? Math.round((activePCs / totalPCs) * 100) : 0;

  // PCs with very low remaining time (< 15 minutes = 900 seconds)
  const lowTimePCs = pcs.filter(
    pc => pc.status === PCStatus.IN_USE && pc.timeRemaining !== undefined && pc.timeRemaining < 900
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <header id="app-topbar" className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20 shadow-sm">
      {/* Search and Lounge Branding */}
      <div className="flex items-center space-x-6 flex-1 max-w-lg">
        <div className="hidden lg:block">
          <span className="text-xs font-semibold text-slate-400 font-mono block uppercase tracking-wider">
            Active Hub
          </span>
          <span className="text-sm font-bold text-slate-800 tracking-tight font-display">
            {loungeName}
          </span>
        </div>
        
        {/* Universal Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PCs, members, games..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
          />
        </div>
      </div>

      {/* Right widgets */}
      <div className="flex items-center space-x-6">
        {/* Occupancy Indicator */}
        <div className="hidden md:flex items-center space-x-4 px-4 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center space-x-1.5">
            <Monitor className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-700">Occupancy:</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  occupancyPercentage > 80 ? "bg-red-500" : occupancyPercentage > 50 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-900 font-mono">
              {activePCs}/{totalPCs} ({occupancyPercentage}%)
            </span>
          </div>
        </div>

        {/* Real-time Clock */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50/50 text-indigo-700 rounded-lg border border-indigo-100/50">
          <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="text-xs font-bold font-mono tracking-wider">{timeString || "00:00:00"}</span>
        </div>

        {/* Warning Indicator if any low time PCs */}
        {lowTimePCs.length > 0 && (
          <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{lowTimePCs.length} PC session{lowTimePCs.length > 1 ? "s" : ""} ending!</span>
          </div>
        )}

        {/* Notifications & Log dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors relative"
            id="notifications-button"
          >
            <Bell className="w-5 h-5" />
            {logs.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2.5 w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-800 text-sm">System Audit Logs</span>
                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-full">
                      {logs.length}
                    </span>
                  </div>
                  <button 
                    onClick={onClearLogs}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No logs recorded.
                    </div>
                  ) : (
                    logs.map((log) => {
                      const colorMap = {
                        success: "bg-emerald-500",
                        danger: "bg-red-500",
                        warning: "bg-amber-500",
                        info: "bg-indigo-500"
                      };
                      return (
                        <div key={log.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-start space-x-3 text-xs">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colorMap[log.severity]}`} />
                          <div className="flex-1">
                            <p className="text-slate-800 font-medium">{log.message}</p>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
                              <span>By: {log.operator}</span>
                              <span>{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-mono">Auto-logging active • Wifi Secure Status</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
