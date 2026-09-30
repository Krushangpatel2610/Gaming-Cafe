import { formatCurrency, currencySymbol } from '../lib/currency';
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
  DollarSign,
  Lock,
  Unlock,
  Plus,
  X,
  ChevronDown,
  Trash2,
  KeyRound,
  Copy,
  Pencil,
  Gamepad2,
  FolderOpen,
  Check,
  Loader2
} from "lucide-react";
import { PC, PCStatus, PCGroup } from "../types";
import { ApiCustomer, ApiSystemType, ApiSystemPlatform } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { CreateSystemBody, UpdateSystemBody } from "../api/systems";
import { listStationGames, installGame, uninstallGame, StationGame } from "../api/games";

interface LivePCsViewProps {
  currency: string;
  pcs: PC[];
  customers: ApiCustomer[];
  systemTypes: ApiSystemType[];
  getHourlyRateForPC: (pc: PC) => number;
  onUpdatePCStatus: (pcId: string, status: PCStatus, currentUser?: string, durationMinutes?: number, customerId?: string) => void;
  onStopSession: (pcId: string) => void;
  onExtendSession: (pcId: string, additionalMinutes: number) => void;
  onLockPC: (pcId: string) => void;
  onUnlockPC: (pcId: string) => void;
  onAddSystem: (body: CreateSystemBody) => Promise<{ systemId: string; apiKey: string } | null>;
  onEditSystem: (pcId: string, body: UpdateSystemBody) => Promise<boolean>;
  onCreateSystemType: (name: string, hourlyBaseRate: number) => Promise<string | null>;
  onDeleteSystem: (pcId: string) => void;
  onRegenerateKey: (pcId: string) => Promise<string | null>;
}

const PLATFORMS: ApiSystemPlatform[] = ["pc", "ps5", "ps4", "xbox", "vr", "other"];

export default function LivePCsView({ currency, pcs,
  customers,
  systemTypes,
  getHourlyRateForPC,
  onUpdatePCStatus,
  onStopSession,
  onExtendSession,
  onLockPC,
  onUnlockPC,
  onAddSystem,
  onEditSystem,
  onCreateSystemType,
  onDeleteSystem,
  onRegenerateKey
}: LivePCsViewProps) {
  const { admin, storeId } = useAuth();
  const canManageHardware = admin?.role === "super_admin" || admin?.role === "admin";
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activePCDetailId, setActivePCDetailId] = useState<string | null>(null);

  // Add Terminal modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newStationNumber, setNewStationNumber] = useState<number>(1);
  const [newPlatform, setNewPlatform] = useState<ApiSystemPlatform>("pc");
  const [newSystemTypeId, setNewSystemTypeId] = useState<string>("");
  const [newCustomRate, setNewCustomRate] = useState<string>("");
  const [newIp, setNewIp] = useState<string>("");
  const [newMac, setNewMac] = useState<string>("");
  const [newCpu, setNewCpu] = useState<string>("");
  const [newGpu, setNewGpu] = useState<string>("");
  const [newRam, setNewRam] = useState<string>("");
  const [newMonitor, setNewMonitor] = useState<string>("");
  const [revealedApiKey, setRevealedApiKey] = useState<string | null>(null);
  const [revealedSystemId, setRevealedSystemId] = useState<string | null>(null);

  // Edit Terminal modal state — rename + reassign pricing tier (systemTypeId).
  // "__custom__" is a sentinel select value (never a real systemTypeId) that
  // reveals a rate input; submitting creates a one-off system type for it.
  const [editPCId, setEditPCId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editSystemTypeId, setEditSystemTypeId] = useState<string>("");
  const [editCustomRate, setEditCustomRate] = useState<string>("");
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const CUSTOM_RATE_VALUE = "__custom__";

  // Modal State for starting a session
  const [startSessionPCId, setStartSessionPCId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customGuestName, setCustomGuestName] = useState<string>("Gamer Guest");
  const [duration, setDuration] = useState<number>(60); // minutes, member path only — guests get a fixed 2hr walk-in block

  // Modal State for extending a session
  const [extendSessionPCId, setExtendSessionPCId] = useState<string | null>(null);
  const [additionalMinutes, setAdditionalMinutes] = useState<number>(30);

  // Station Games modal state (station-specific paths & game installation)
  const [stationGamesPC, setStationGamesPC] = useState<PC | null>(null);
  const [stationGames, setStationGames] = useState<StationGame[]>([]);
  const [loadingStationGames, setLoadingStationGames] = useState<boolean>(false);
  const [stationGamesSearch, setStationGamesSearch] = useState<string>("");
  const [savingStationGameId, setSavingStationGameId] = useState<string | null>(null);
  const [stationGamePaths, setStationGamePaths] = useState<Record<string, string>>({});

  const openStationGamesModal = async (pc: PC) => {
    setStationGamesPC(pc);
    setLoadingStationGames(true);
    setStationGamesSearch("");
    if (storeId) {
      try {
        const games = await listStationGames(storeId, pc.id);
        setStationGames(games);
        const paths: Record<string, string> = {};
        games.forEach(g => {
          paths[g.id] = g.executablePath || "";
        });
        setStationGamePaths(paths);
      } catch (err) {
        console.error("Failed to load station games:", err);
      } finally {
        setLoadingStationGames(false);
      }
    } else {
      setLoadingStationGames(false);
    }
  };

  const handleToggleStationGame = async (game: StationGame) => {
    if (!storeId || !stationGamesPC) return;
    setSavingStationGameId(game.id);
    try {
      if (game.isInstalled) {
        await uninstallGame(storeId, stationGamesPC.id, game.id);
        setStationGames(prev => prev.map(g => g.id === game.id ? { ...g, isInstalled: false } : g));
      } else {
        const path = stationGamePaths[game.id]?.trim() || null;
        await installGame(storeId, stationGamesPC.id, game.id, path);
        setStationGames(prev => prev.map(g => g.id === game.id ? { ...g, isInstalled: true, executablePath: path } : g));
      }
    } catch (err) {
      console.error("Failed to update station game installation:", err);
    } finally {
      setSavingStationGameId(null);
    }
  };

  const handleSaveStationGamePath = async (gameId: string) => {
    if (!storeId || !stationGamesPC) return;
    setSavingStationGameId(gameId);
    try {
      const path = stationGamePaths[gameId]?.trim() || null;
      await installGame(storeId, stationGamesPC.id, gameId, path);
      setStationGames(prev => prev.map(g => g.id === gameId ? { ...g, isInstalled: true, executablePath: path } : g));
    } catch (err) {
      console.error("Failed to save station executable path:", err);
    } finally {
      setSavingStationGameId(null);
    }
  };

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

  const handleStartSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startSessionPCId) return;

    if (isGuest) {
      onUpdatePCStatus(startSessionPCId, PCStatus.IN_USE, customGuestName || "Guest Gamer", undefined, undefined);
    } else {
      const selectedCustomer = customers.find(c => c.userId === selectedCustomerId);
      if (!selectedCustomer) return;
      onUpdatePCStatus(startSessionPCId, PCStatus.IN_USE, selectedCustomer.name || "Member", duration, selectedCustomer.userId);
    }
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

  const startPC = pcs.find(p => p.id === startSessionPCId);
  const startRate = startPC ? getHourlyRateForPC(startPC) : 0;
  const extendPC = pcs.find(p => p.id === extendSessionPCId);
  const extendRate = extendPC ? getHourlyRateForPC(extendPC) : 0;

  const resetAddForm = () => {
    setNewName("");
    setNewStationNumber(pcs.length + 1);
    setNewPlatform("pc");
    setNewSystemTypeId("");
    setNewCustomRate("");
    setNewIp("");
    setNewMac("");
    setNewCpu("");
    setNewGpu("");
    setNewRam("");
    setNewMonitor("");
    setShowAdvanced(false);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const specs: Record<string, string> = {};
    if (newCpu) specs.cpu = newCpu;
    if (newGpu) specs.gpu = newGpu;
    if (newRam) specs.ram = newRam;
    if (newMonitor) specs.monitor = newMonitor;

    let systemTypeId = newSystemTypeId || undefined;
    if (newSystemTypeId === CUSTOM_RATE_VALUE) {
      const rate = parseFloat(newCustomRate);
      if (!rate || rate <= 0) return;
      const newTypeId = await onCreateSystemType(`${newName} — Custom Rate`, rate);
      if (!newTypeId) return;
      systemTypeId = newTypeId;
    }

    const result = await onAddSystem({
      name: newName,
      stationNumber: newStationNumber,
      platform: newPlatform,
      systemTypeId,
      ipAddress: newIp || undefined,
      macAddress: newMac || undefined,
      specs: Object.keys(specs).length > 0 ? specs : undefined
    });
    setShowAddModal(false);
    resetAddForm();
    if (result) {
      setRevealedApiKey(result.apiKey);
      setRevealedSystemId(result.systemId);
    }
  };

  const handleRegenerateClick = async (pcId: string, pcName: string) => {
    if (!window.confirm(`Regenerate the API key for ${pcName}? The old key will stop working immediately — update the agent config right after.`)) return;
    const apiKey = await onRegenerateKey(pcId);
    if (apiKey) {
      setRevealedApiKey(apiKey);
      setRevealedSystemId(pcId);
    }
  };

  const handleDeleteClick = (pcId: string, pcName: string) => {
    if (!window.confirm(`Deactivate ${pcName}? It will no longer appear as a bookable terminal.`)) return;
    onDeleteSystem(pcId);
  };

  const handleEditClick = (pc: PC) => {
    setEditPCId(pc.id);
    setEditName(pc.name);
    setEditSystemTypeId(pc.systemTypeId || "");
    setEditCustomRate("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPCId) return;
    setEditSubmitting(true);

    let systemTypeId = editSystemTypeId || undefined;
    if (editSystemTypeId === CUSTOM_RATE_VALUE) {
      const rate = parseFloat(editCustomRate);
      if (!rate || rate <= 0) {
        setEditSubmitting(false);
        return;
      }
      const newTypeId = await onCreateSystemType(`${editName} — Custom Rate`, rate);
      if (!newTypeId) {
        setEditSubmitting(false);
        return;
      }
      systemTypeId = newTypeId;
    }

    const ok = await onEditSystem(editPCId, { name: editName, systemTypeId });
    setEditSubmitting(false);
    if (ok) setEditPCId(null);
  };

  const editPC = pcs.find(p => p.id === editPCId);

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
          {canManageHardware && (
            <button
              onClick={() => { resetAddForm(); setShowAddModal(true); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Terminal</span>
            </button>
          )}
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
          const rate = getHourlyRateForPC(pc);

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
                    <span className="text-xs font-mono font-bold text-slate-400">{pc.id.slice(0, 8).toUpperCase()}</span>
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
                        <Clock className={`w-3 h-3 ${pc.timeRemaining !== undefined && pc.timeRemaining <= 900 ? "text-amber-600 animate-pulse" : "text-indigo-600"}`} />
                        <span className={pc.timeRemaining !== undefined && pc.timeRemaining <= 900 ? "text-amber-700 font-bold" : ""}>
                          {formatRemaining(pc.timeRemaining)}
                        </span>
                      </div>
                      <span className="font-bold">{formatCurrency(rate.toFixed(2), currency)}/hr</span>
                    </div>
                    {pc.targetCapMinutes != null && (
                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-indigo-100/60 pt-1.5 font-mono">
                        <span className="text-slate-400">Target Goal:</span>
                        <span className="bg-indigo-100/80 text-indigo-800 px-1.5 py-0.5 rounded font-semibold">
                          {Math.floor(pc.targetCapMinutes / 60)}h {pc.targetCapMinutes % 60}m cap
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-mono uppercase">Idle Station</p>
                    <p className="text-xs font-semibold text-slate-600">
                      {pc.status === PCStatus.AVAILABLE
                        ? `Ready for login • ₹${rate.toFixed(2)}/hr`
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
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between gap-2">
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

                {/* Remote lock/unlock — independent of session state, pushed
                    over the agent WebSocket to the physical PC Client */}
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/70">
                  <span className="text-[10px] text-slate-400 font-mono uppercase mr-auto">Remote:</span>
                  <button
                    onClick={() => onLockPC(pc.id)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded text-[10px] font-bold flex items-center space-x-1"
                    title="Force-lock this PC regardless of session state"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Lock</span>
                  </button>
                  <button
                    onClick={() => onUnlockPC(pc.id)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded text-[10px] font-bold flex items-center space-x-1"
                    title="Force-unlock this PC regardless of session state"
                  >
                    <Unlock className="w-3 h-3" />
                    <span>Unlock</span>
                  </button>
                  <button
                    onClick={() => openStationGamesModal(pc)}
                    className="px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-600 hover:text-indigo-700 rounded text-[10px] font-bold flex items-center space-x-1"
                    title="Manage installed games & executable paths for this station"
                  >
                    <Gamepad2 className="w-3 h-3 text-indigo-600" />
                    <span>Games</span>
                  </button>
                  {canManageHardware && (
                    <>
                      <button
                        onClick={() => handleEditClick(pc)}
                        className="px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-500 hover:text-indigo-700 rounded text-[10px] font-bold flex items-center space-x-1"
                        title="Edit terminal name / pricing tier"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRegenerateClick(pc.id, pc.name)}
                        className="px-2 py-1 bg-white hover:bg-amber-50 border border-slate-200 text-slate-500 hover:text-amber-700 rounded text-[10px] font-bold flex items-center space-x-1"
                        title="Regenerate this terminal's API key"
                      >
                        <KeyRound className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(pc.id, pc.name)}
                        className="px-2 py-1 bg-white hover:bg-red-50 border border-slate-200 text-slate-500 hover:text-red-700 rounded text-[10px] font-bold flex items-center space-x-1"
                        title="Deactivate this terminal"
                      >
                        <Trash2 className="w-3 h-3" />
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
              <p className="text-xs text-slate-400 mt-1">Configure user login credentials and rates for {startPC?.name}</p>
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
                  <p className="text-[10px] text-slate-400 pt-1">Walk-in sessions are a standard 2-hour block (no reservation on file) — this goes through the real booking system, not just a bare session.</p>
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
                    {customers.filter(c => !c.isSuspended).map(cust => (
                      <option key={cust.userId} value={cust.userId}>
                        {cust.name || cust.phone || cust.userId.slice(0, 8)} (Balance: {formatCurrency(parseFloat(cust.creditsBalance).toFixed(2), currency)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Duration configuration — member path only, walk-ins are a fixed 2hr block */}
              {!isGuest && (
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
              )}

              {/* Cost Calculation block */}
              <div className="bg-indigo-50 p-3.5 rounded-lg border border-indigo-100 text-xs flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-indigo-800 font-semibold block">Estimated session cost:</span>
                  <span className="text-[10px] text-indigo-600 font-mono">
                    {isGuest ? 120 : duration} mins @ {formatCurrency(startRate.toFixed(2), currency)}/hr
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-indigo-900 font-mono">
                    {formatCurrency((((isGuest ? 120 : duration) / 60) * startRate).toFixed(2), currency)}
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
              <p className="text-xs text-slate-400 mt-1">Add additional gameplay credits to {extendPC?.name}</p>
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
                    +{additionalMinutes} mins @ {formatCurrency(extendRate.toFixed(2), currency)}/hr
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-indigo-900 font-mono">
                    {formatCurrency(((additionalMinutes / 60) * extendRate).toFixed(2), currency)}
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

      {/* MODAL: Edit Terminal — rename + reassign pricing tier. Pricing is
          per-system-type, not per-PC, so "changing the price" here means
          picking a different tier rather than typing a custom rate. */}
      {editPCId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Edit Terminal</h3>
                <p className="text-xs text-slate-400 mt-1">Update {editPC?.name}'s name and pricing tier.</p>
              </div>
              <button onClick={() => setEditPCId(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Terminal Name</label>
                <input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">System Type (sets hourly rate)</label>
                <select
                  value={editSystemTypeId}
                  onChange={(e) => setEditSystemTypeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">-- None (no rate assigned) --</option>
                  {systemTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} — {formatCurrency(parseFloat(t.hourlyBaseRate).toFixed(2), currency)}/hr</option>
                  ))}
                  <option value={CUSTOM_RATE_VALUE}>Custom (enter rate)...</option>
                </select>
                {editSystemTypeId === CUSTOM_RATE_VALUE ? (
                  <div className="pt-2 space-y-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">₹</span>
                      <input
                        required
                        type="number"
                        min="1"
                        step="0.01"
                        autoFocus
                        value={editCustomRate}
                        onChange={(e) => setEditCustomRate(e.target.value)}
                        placeholder="e.g. 150"
                        className="w-full pl-6 pr-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">/hr</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Creates a new pricing tier just for this rate — it won't affect other terminals.</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 pt-1">Pricing is tied to the system type, not the individual terminal — reassign the tier to change this station's hourly rate.</p>
                )}
              </div>

              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditPCId(null)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 disabled:opacity-50"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Add Terminal — streamlined, name/platform/type up front, hardware details tucked behind Advanced */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between sticky top-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Add New Terminal</h3>
                <p className="text-xs text-slate-400 mt-1">Registers a new gaming station and issues its API key.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Terminal Name</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="e.g. Station 07"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Station Number</label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={9999}
                    value={newStationNumber}
                    onChange={(e) => setNewStationNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as ApiSystemPlatform)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none appearance-none cursor-pointer uppercase"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">System Type (sets hourly rate)</label>
                <select
                  value={newSystemTypeId}
                  onChange={(e) => setNewSystemTypeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">-- None (no rate assigned yet) --</option>
                  {systemTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} — {formatCurrency(parseFloat(t.hourlyBaseRate).toFixed(2), currency)}/hr</option>
                  ))}
                  <option value={CUSTOM_RATE_VALUE}>Custom (enter rate)...</option>
                </select>
                {newSystemTypeId === CUSTOM_RATE_VALUE && (
                  <div className="pt-2 space-y-1">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">₹</span>
                      <input
                        required
                        type="number"
                        min="1"
                        step="0.01"
                        autoFocus
                        value={newCustomRate}
                        onChange={(e) => setNewCustomRate(e.target.value)}
                        placeholder="e.g. 150"
                        className="w-full pl-6 pr-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">/hr</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Creates a new pricing tier just for this rate.</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
              >
                <span>Advanced (network, hardware specs)</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </button>

              {showAdvanced && (
                <div className="space-y-3 border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">IP Address</label>
                      <input value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="192.168.1.20" className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">MAC Address</label>
                      <input value={newMac} onChange={(e) => setNewMac(e.target.value)} placeholder="AA:BB:CC:00:11:22" className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">CPU</label>
                      <input value={newCpu} onChange={(e) => setNewCpu(e.target.value)} placeholder="Ryzen 7 5800X" className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">GPU</label>
                      <input value={newGpu} onChange={(e) => setNewGpu(e.target.value)} placeholder="RTX 4070" className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">RAM</label>
                      <input value={newRam} onChange={(e) => setNewRam(e.target.value)} placeholder="32GB DDR5" className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Monitor</label>
                      <input value={newMonitor} onChange={(e) => setNewMonitor(e.target.value)} placeholder="27&quot; 165Hz" className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10">
                  Register Terminal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Reveal System ID + API key — shown exactly once, on create or regenerate.
          These are the exact two values the PC Client installer asks for
          ("System ID (this specific PC)" and "Agent API Key") — surfacing
          both together here means nobody has to hunt for the System ID
          separately when pairing the physical machine. */}
      {revealedApiKey && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-amber-50">
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2"><KeyRound className="w-4 h-4 text-amber-600" />Terminal Connection Details</h3>
              <p className="text-xs text-amber-700 mt-1">Save these now — the API key will not be shown again. Enter both into the PC Client installer on this station.</p>
            </div>
            <div className="p-5 space-y-3">
              {revealedSystemId && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">System ID</label>
                  <div className="flex items-center gap-2 bg-slate-900 text-indigo-300 font-mono text-xs rounded-lg p-3 break-all">
                    <span className="flex-1">{revealedSystemId}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(revealedSystemId)}
                      className="text-slate-400 hover:text-white shrink-0"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Agent API Key</label>
                <div className="flex items-center gap-2 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg p-3 break-all">
                  <span className="flex-1">{revealedApiKey}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(revealedApiKey)}
                    className="text-slate-400 hover:text-white shrink-0"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => { setRevealedApiKey(null); setRevealedSystemId(null); }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Done — I've saved it
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* MODAL: Manage Station Games & Executable Paths */}
      {stationGamesPC && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-indigo-600" />
                  Station Games &amp; Paths — {stationGamesPC.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure which games are installed on this station and their local executable path on this machine.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStationGamesPC(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter games by title or genre..."
                  value={stationGamesSearch}
                  onChange={(e) => setStationGamesSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
                />
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {loadingStationGames ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs">Loading games for this station...</span>
                </div>
              ) : stationGames.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No games found in the game library. Add games in the Game Library tab first.
                </div>
              ) : (
                stationGames
                  .filter(g =>
                    g.name.toLowerCase().includes(stationGamesSearch.toLowerCase()) ||
                    (g.genre && g.genre.toLowerCase().includes(stationGamesSearch.toLowerCase()))
                  )
                  .map(game => {
                    const isSaving = savingStationGameId === game.id;
                    const path = stationGamePaths[game.id] ?? (game.executablePath || "");

                    return (
                      <div
                        key={game.id}
                        className={`p-3.5 rounded-lg border transition-all ${
                          game.isInstalled
                            ? "bg-white border-indigo-200 shadow-sm"
                            : "bg-slate-50/50 border-slate-200 opacity-80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <input
                              type="checkbox"
                              id={`station-game-${game.id}`}
                              checked={game.isInstalled}
                              onChange={() => handleToggleStationGame(game)}
                              disabled={isSaving}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                            />
                            <label
                              htmlFor={`station-game-${game.id}`}
                              className="text-xs font-bold text-slate-900 cursor-pointer truncate"
                            >
                              {game.name}
                            </label>
                            {game.genre && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                                {game.genre}
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            game.isInstalled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
                          }`}>
                            {game.isInstalled ? "Installed" : "Not Installed"}
                          </span>
                        </div>

                        {/* Station Path Input */}
                        <div className="pl-6.5 mt-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
                            <span>Station Executable Path</span>
                            <span className="text-[10px] text-slate-400 font-normal">Press Enter or click Save</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={path}
                              placeholder="e.g. C:\Games\Valorant\live\ShooterGame\Binaries\Win64\VALORANT-Win64-Shipping.exe"
                              onChange={(e) => {
                                const val = e.target.value;
                                setStationGamePaths(prev => ({ ...prev, [game.id]: val }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSaveStationGamePath(game.id);
                                }
                              }}
                              disabled={isSaving}
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />

                            {/* Hidden file input for native file browsing */}
                            <input
                              type="file"
                              id={`station-file-picker-${game.id}`}
                              className="hidden"
                              accept=".exe,.bat,.cmd,.lnk"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const guessed = `C:\\Games\\${game.name}\\${file.name}`;
                                  setStationGamePaths(prev => ({ ...prev, [game.id]: guessed }));
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(`station-file-picker-${game.id}`);
                                el?.click();
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1 shrink-0"
                              title="Browse for executable"
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                              <span>Browse</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSaveStationGamePath(game.id)}
                              disabled={isSaving}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shrink-0 disabled:opacity-50"
                            >
                              {isSaving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setStationGamesPC(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
