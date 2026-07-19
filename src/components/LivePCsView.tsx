import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Monitor, 
  Cpu, 
  Play, 
  Power, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter,
  Users,
  Terminal,
  Zap,
  Info,
  DollarSign
} from "lucide-react";
import { PC, PCStatus, PCGroup, Customer, SystemSettings } from "../types";

interface LivePCsViewProps {
  pcs: PC[];
  customers: Customer[];
  settings: SystemSettings;
  onUpdatePCStatus: (pcId: string, status: PCStatus, currentUser?: string, durationMinutes?: number) => void;
  onStopSession: (pcId: string) => void;
  onExtendSession: (pcId: string, additionalMinutes: number) => void;
}

export default function LivePCsView({ 
  pcs, 
  customers, 
  settings, 
  onUpdatePCStatus, 
  onStopSession, 
  onExtendSession 
}: LivePCsViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activePCDetailId, setActivePCDetailId] = useState<string | null>(null);

  // Modal State for starting a session
  const [startSessionPCId, setStartSessionPCId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customGuestName, setCustomGuestName] = useState<string>("Gamer Guest");
  const [duration, setDuration] = useState<number>(60); // minutes

  // Modal State for extending a session
  const [extendSessionPCId, setExtendSessionPCId] = useState<string | null>(null);
  const [additionalMinutes, setAdditionalMinutes] = useState<number>(30);

  // Filter computations
  const filteredPCs = pcs.filter(pc => {
    const matchesGroup = selectedGroup === "All" || pc.group === selectedGroup;
    const matchesStatus = selectedStatus === "All" || pc.status === selectedStatus;
    const matchesSearch = pc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pc.ip.includes(searchQuery) ||
                          (pc.currentUser && pc.currentUser.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          pc.specs.cpu.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pc.specs.gpu.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: PCStatus) => {
    switch (status) {
      case PCStatus.AVAILABLE:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case PCStatus.IN_USE:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case PCStatus.MAINTENANCE:
        return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
      case PCStatus.OFFLINE:
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  const getHourlyRateForPC = (group: PCGroup) => {
    switch (group) {
      case PCGroup.VIP:
        return settings.vipRate;
      case PCGroup.STANDARD:
        return settings.standardRate;
      case PCGroup.CONSOLE:
        return settings.consoleRate;
      case PCGroup.STREAMING:
        return settings.streamingRate;
      default:
        return settings.standardRate;
    }
  };

  const handleStartSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startSessionPCId) return;

    let userName = "";
    if (isGuest) {
      userName = customGuestName || "Guest Gamer";
    } else {
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
      userName = selectedCustomer ? selectedCustomer.name : "Guest Gamer";
    }

    onUpdatePCStatus(startSessionPCId, PCStatus.IN_USE, userName, duration);
    setStartSessionPCId(null);
    setSelectedCustomerId("");
    setCustomGuestName("Gamer Guest");
  };

  const handleExtendSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendSessionPCId) return;

    onExtendSession(extendSessionPCId, additionalMinutes);
    setExtendSessionPCId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Live Terminals & Hardware Grid</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status tracking, hardware profiling, power toggles, and direct terminal management.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {["All", PCGroup.VIP, PCGroup.STANDARD, PCGroup.CONSOLE, PCGroup.STREAMING].map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  selectedGroup === group
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-950"
                }`}
              >
                {group === "All" ? "All Zones" : group.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search terminal ID, GPU, active customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value={PCStatus.AVAILABLE}>Available</option>
            <option value={PCStatus.IN_USE}>In-Use</option>
            <option value={PCStatus.MAINTENANCE}>Maintenance</option>
            <option value={PCStatus.OFFLINE}>Offline</option>
          </select>
        </div>

        {/* Info card of filters */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Filtered Terminals:</span>
          <span className="font-bold text-slate-900">{filteredPCs.length} of {pcs.length}</span>
        </div>
      </div>

      {/* Grid Layout of PCs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPCs.map((pc) => {
          const isDetailActive = activePCDetailId === pc.id;
          const rate = getHourlyRateForPC(pc.group);

          const formatRemaining = (seconds?: number) => {
            if (seconds === undefined) return "Unlimited";
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            return `${h}h ${m}m left`;
          };

          return (
            <div
              key={pc.id}
              className={`bg-white rounded-xl border transition-all duration-150 flex flex-col shadow-precision overflow-hidden ${
                pc.status === PCStatus.IN_USE 
                  ? "border-indigo-200 ring-2 ring-indigo-500/5" 
                  : pc.status === PCStatus.MAINTENANCE
                  ? "border-amber-200"
                  : "border-slate-200"
              }`}
            >
              {/* PC Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{pc.id.toUpperCase()}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="text-xs font-semibold text-slate-500 font-mono">{pc.group}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mt-1 truncate">{pc.name}</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(pc.status)}`}>
                  {pc.status}
                </span>
              </div>

              {/* PC Content details */}
              <div className="p-5 flex-1 space-y-4">
                {/* Active user state if In Use */}
                {pc.status === PCStatus.IN_USE ? (
                  <div className="bg-indigo-50/60 rounded-lg p-3 border border-indigo-100/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-900 truncate">{pc.currentUser}</span>
                      </div>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">Active</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-indigo-800 font-mono">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-indigo-600" />
                        <span>{formatRemaining(pc.timeRemaining)}</span>
                      </div>
                      <span className="font-bold">${rate.toFixed(2)}/hr</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-mono uppercase">Idle Station</p>
                    <p className="text-xs font-semibold text-slate-600">
                      {pc.status === PCStatus.AVAILABLE 
                        ? `Ready for login • $${rate.toFixed(2)}/hr` 
                        : pc.status === PCStatus.MAINTENANCE 
                        ? "Currently in diagnostics" 
                        : "Powered off / Offline"}
                    </p>
                  </div>
                )}

                {/* PC specs compact list */}
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{pc.specs.gpu}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[10px] text-slate-400">{pc.ip}</span>
                  </div>
                </div>

                {/* Extended Specs fold-out */}
                {isDetailActive && (
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs bg-slate-50 p-2.5 rounded-lg border">
                    <p className="font-bold text-[10px] text-slate-400 uppercase font-mono tracking-wider">Specifications:</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-400 block">CPU:</span>
                        <span className="text-slate-700 font-medium truncate block">{pc.specs.cpu}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">RAM:</span>
                        <span className="text-slate-700 font-medium block">{pc.specs.ram}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block">Monitor:</span>
                        <span className="text-slate-700 font-medium block truncate">{pc.specs.monitor}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PC Actions Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => setActivePCDetailId(isDetailActive ? null : pc.id)}
                  className="p-1.5 hover:bg-slate-200/60 rounded text-slate-500 hover:text-slate-700 font-mono text-[11px]"
                  title="Toggle hardware specs details"
                >
                  <Info className="w-4 h-4 inline mr-1" />
                  Specs
                </button>

                <div className="flex items-center space-x-1.5">
                  {pc.status === PCStatus.IN_USE ? (
                    <>
                      <button
                        onClick={() => setExtendSessionPCId(pc.id)}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold border border-indigo-200/50"
                        title="Extend current play session"
                      >
                        +Time
                      </button>
                      <button
                        onClick={() => onStopSession(pc.id)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-bold border border-red-200/50"
                        title="Force release/stop session"
                      >
                        Release
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Available controls */}
                      <button
                        onClick={() => {
                          if (pc.status === PCStatus.AVAILABLE) {
                            setStartSessionPCId(pc.id);
                          } else {
                            onUpdatePCStatus(pc.id, PCStatus.AVAILABLE);
                          }
                        }}
                        disabled={pc.status === PCStatus.OFFLINE}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center space-x-1 border ${
                          pc.status === PCStatus.AVAILABLE
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600 shadow-sm"
                            : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{pc.status === PCStatus.AVAILABLE ? "Start" : "Ready"}</span>
                      </button>

                      {/* Maintenance / Offline toggles */}
                      <button
                        onClick={() => {
                          const nextStatus = pc.status === PCStatus.MAINTENANCE ? PCStatus.AVAILABLE : PCStatus.MAINTENANCE;
                          onUpdatePCStatus(pc.id, nextStatus);
                        }}
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-amber-600 rounded-lg"
                        title="Toggle maintenance state"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          const nextStatus = pc.status === PCStatus.OFFLINE ? PCStatus.AVAILABLE : PCStatus.OFFLINE;
                          onUpdatePCStatus(pc.id, nextStatus);
                        }}
                        className={`p-1.5 border rounded-lg ${
                          pc.status === PCStatus.OFFLINE
                            ? "bg-slate-800 text-slate-400 border-slate-900 hover:bg-slate-700"
                            : "bg-white hover:bg-slate-100 text-slate-500 hover:text-red-600 border-slate-200"
                        }`}
                        title={pc.status === PCStatus.OFFLINE ? "Turn station ON" : "Turn station OFF"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Start Session */}
      {startSessionPCId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">Start Gaming Session</h3>
              <p className="text-xs text-slate-400 mt-1">Configure user login credentials and rates for {startSessionPCId.toUpperCase()}</p>
            </div>
            
            <form onSubmit={handleStartSessionSubmit} className="p-6 space-y-4">
              {/* User Type Choice */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">User Classification</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGuest(true)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      isGuest 
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Guest Gamer
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGuest(false)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      !isGuest 
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    Registered Member
                  </button>
                </div>
              </div>

              {/* Guest input or Member selector */}
              {isGuest ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Temporary Guest Name</label>
                  <input
                    type="text"
                    value={customGuestName}
                    onChange={(e) => setCustomGuestName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Member Profile</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 appearance-none cursor-pointer"
                  >
                    <option value="">-- Select Member --</option>
                    {customers.filter(c => c.status === "Active").map(cust => (
                      <option key={cust.id} value={cust.id}>
                        {cust.name} ({cust.membershipLevel} - Balance: ${cust.balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Duration configuration */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Duration Option</label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 120, 240].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDuration(mins)}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border text-center transition-all ${
                        duration === mins 
                          ? "bg-slate-900 border-slate-950 text-white shadow-sm" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {mins >= 60 ? `${mins / 60} hr` : `${mins} min`}
                    </button>
                  ))}
                </div>
                <div className="pt-2">
                  <input
                    type="number"
                    min="15"
                    max="1440"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none bg-slate-50"
                    placeholder="Custom minutes (e.g. 180)"
                  />
                </div>
              </div>

              {/* Cost Calculation block */}
              <div className="bg-indigo-50 p-3.5 rounded-lg border border-indigo-100 text-xs flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-indigo-800 font-semibold block">Estimated session cost:</span>
                  <span className="text-[10px] text-indigo-600 font-mono">
                    {duration} mins @ ${getHourlyRateForPC(pcs.find(p => p.id === startSessionPCId)?.group || PCGroup.STANDARD).toFixed(2)}/hr
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-indigo-900 font-mono">
                    ${((duration / 60) * getHourlyRateForPC(pcs.find(p => p.id === startSessionPCId)?.group || PCGroup.STANDARD)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStartSessionPCId(null)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/10"
                >
                  Initialize Login
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Extend Session */}
      {extendSessionPCId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 font-display">Extend Gaming Session</h3>
              <p className="text-xs text-slate-400 mt-1">Add additional gameplay credits to {extendSessionPCId.toUpperCase()}</p>
            </div>
            
            <form onSubmit={handleExtendSessionSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Additional Time Option</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 60, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setAdditionalMinutes(mins)}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border text-center transition-all ${
                        additionalMinutes === mins 
                          ? "bg-indigo-600 border-indigo-700 text-white shadow-sm" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      +{mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimate cost increment */}
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-xs flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-indigo-800 font-semibold block">Incremental charge:</span>
                  <span className="text-[10px] text-indigo-600 font-mono">
                    +{additionalMinutes} mins @ ${getHourlyRateForPC(pcs.find(p => p.id === extendSessionPCId)?.group || PCGroup.STANDARD).toFixed(2)}/hr
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-indigo-900 font-mono">
                    ${((additionalMinutes / 60) * getHourlyRateForPC(pcs.find(p => p.id === extendSessionPCId)?.group || PCGroup.STANDARD)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendSessionPCId(null)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg"
                >
                  Add Time
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
