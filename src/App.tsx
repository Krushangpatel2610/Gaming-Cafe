import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import TopNavBar from "./components/TopNavBar";
import DashboardView from "./components/DashboardView";
import LivePCsView from "./components/LivePCsView";
import SessionsView from "./components/SessionsView";
import CustomersView from "./components/CustomersView";
import GameLibraryView from "./components/GameLibraryView";
import OffersView from "./components/OffersView";
import LeaderboardsView from "./components/LeaderboardsView";
import SettingsView from "./components/SettingsView";
import LoginView from "./components/LoginView";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ApiError } from "./api/client";
import { listLiveSystems, updateSystem, lockSystem, unlockSystem } from "./api/systems";
import { listActiveSessions, listSessions, startManualSession, endSession, extendSession } from "./api/sessions";
import { createWalkInBooking } from "./api/bookings";
import { adaptSystemToPC, adaptSessionToUI, pcStatusToApiStatus } from "./api/adapters";
import { listCustomers, registerCustomer, suspendCustomer, activateCustomer } from "./api/customers";
import { adjustCredits } from "./api/credits";
import { listGames, createGame, updateGame } from "./api/games";
import { listCampaigns, createCampaign, cancelCampaign, pauseCampaign, resumeCampaign } from "./api/campaigns";
import { listSystemTypes, updateSystemTypeRate } from "./api/systemTypes";
import { updateStore } from "./api/stores";
import { ApiCustomer, ApiGame, ApiCampaign, ApiSystemType } from "./api/types";

import {
  PC,
  PCStatus,
  PCGroup,
  Session,
  LeaderboardEntry,
  SystemSettings,
  ActivityLog
} from "./types";

import {
  initialLeaderboards,
  initialSettings,
  initialLogs
} from "./data/mockData";

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { admin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-mono">
        Loading session...
      </div>
    );
  }

  if (!admin) {
    return <LoginView />;
  }

  return <Dashboard />;
}

function Dashboard() {
  const { storeId } = useAuth();

  // Core States
  const [pcs, setPCs] = useState<PC[]>([]);
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [games, setGames] = useState<ApiGame[]>([]);
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [systemTypes, setSystemTypes] = useState<ApiSystemType[]>([]);
  // Leaderboard has no backend concept at all (confirmed against the real
  // API) — left as local mock data rather than inventing a feature nobody
  // asked for. Everything else on this page is real.
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboards);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [liveDataError, setLiveDataError] = useState<string | null>(null);

  // Helper: Log generator
  const addLog = (type: ActivityLog["type"], message: string, severity: ActivityLog["severity"] = "info") => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      operator: "Staff_Michael",
      severity
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Rate lookup now goes through the real System Types list (each PC links
  // to one via systemTypeId) instead of a fixed 4-value settings object —
  // see types.ts's PC.systemTypeId / SystemSettings comments for why.
  const getHourlyRateForPC = useCallback((pc: PC): number => {
    const type = systemTypes.find(t => t.id === pc.systemTypeId);
    if (type) return parseFloat(type.hourlyBaseRate);
    return systemTypes.length > 0 ? parseFloat(systemTypes[0].hourlyBaseRate) : 0;
  }, [systemTypes]);

  // LIVE DATA: pulls Systems + active Sessions from the real backend
  const refreshLiveData = useCallback(async () => {
    if (!storeId) return;
    try {
      const [systems, activeSessions] = await Promise.all([
        listLiveSystems(storeId),
        listActiveSessions(storeId)
      ]);

      const activeSessionBySystem = new Map(activeSessions.map(s => [s.systemId, s]));
      const nextPCs = systems.map(sys => adaptSystemToPC(sys, activeSessionBySystem.get(sys.id)));
      setPCs(nextPCs);
      setLiveDataError(null);
    } catch (err) {
      setLiveDataError(err instanceof ApiError ? err.message : "Failed to load live data from the server.");
    }
  }, [storeId]);

  // Full session history (any status) for the Sessions view's history tab —
  // separate from the 6s live poll above since it doesn't need to be that
  // fresh and the rate calculation depends on systemTypes being loaded first.
  const refreshSessionHistory = useCallback(async () => {
    if (!storeId) return;
    try {
      const allSessions = await listSessions(storeId, { limit: 100 });
      const nextSessions = allSessions.map(s => {
        const pc = pcs.find(p => p.id === s.systemId);
        const rate = pc ? getHourlyRateForPC(pc) : (systemTypes[0] ? parseFloat(systemTypes[0].hourlyBaseRate) : 0);
        // The backend doesn't expose a display name for a session's player — only a
        // userId (no admin "get user" endpoint exists yet) or a walk-in phone number.
        const customer = s.userId ? customers.find(c => c.userId === s.userId) : undefined;
        const customerName = customer?.name || s.walkInPhone || (s.userId ? `Member ${s.userId.slice(0, 6)}` : "Guest");
        return adaptSessionToUI(s, pc?.name || s.systemId, rate, customerName);
      });
      setSessions(nextSessions);
    } catch (err) {
      // Non-fatal — the live grid (refreshLiveData) is the primary signal;
      // history is secondary and just won't update this cycle on failure.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, pcs, systemTypes, customers, getHourlyRateForPC]);

  // refreshSessionHistory's identity changes on every pcs/systemTypes/
  // customers update (it needs the latest values to compute rates/names
  // correctly) — but pcs itself gets a new array reference every second
  // from the local countdown ticker below. Depending on that directly would
  // refire this fetch once a second instead of once per 6s poll, so the
  // latest closure is kept in a ref and the interval only ever depends on
  // storeId — genuinely fires every 6s, not every re-render.
  const refreshSessionHistoryRef = React.useRef(refreshSessionHistory);
  useEffect(() => {
    refreshSessionHistoryRef.current = refreshSessionHistory;
  });

  useEffect(() => {
    if (!storeId) return;
    const tick = async () => {
      await refreshLiveData();
      await refreshSessionHistoryRef.current();
    };
    tick();
    const interval = setInterval(tick, 6000);
    return () => clearInterval(interval);
  }, [storeId, refreshLiveData]);

  // ONE-TIME + MANUAL-REFRESH DATA: customers, games, campaigns, system
  // types, store profile. These change far less often than live PC/session
  // state, so they're not on the 6s poll — refreshed on mount and after any
  // mutation that touches them.
  const refreshCustomers = useCallback(async () => {
    if (!storeId) return;
    try {
      const { data } = await listCustomers(storeId, { limit: 100 });
      setCustomers(data);
    } catch (err) {
      addLog("System", `Failed to load customers: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const refreshGames = useCallback(async () => {
    if (!storeId) return;
    try {
      setGames(await listGames(storeId));
    } catch (err) {
      addLog("System", `Failed to load games: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const refreshCampaigns = useCallback(async () => {
    if (!storeId) return;
    try {
      const { data } = await listCampaigns(storeId, { limit: 100 });
      setCampaigns(data);
    } catch (err) {
      addLog("System", `Failed to load offers: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const refreshSystemTypes = useCallback(async () => {
    if (!storeId) return;
    try {
      setSystemTypes(await listSystemTypes(storeId));
    } catch (err) {
      addLog("System", `Failed to load system types: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;
    refreshCustomers();
    refreshGames();
    refreshCampaigns();
    refreshSystemTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  // BACKGROUND INTERVAL: purely local 1-second countdown display for active sessions.
  // The real end/extend/grace-period decisions are made server-side and reconciled by
  // refreshLiveData's poll above — this interval never itself ends a session.
  useEffect(() => {
    const timer = setInterval(() => {
      setPCs(prevPCs =>
        prevPCs.map(pc =>
          pc.status === PCStatus.IN_USE && pc.timeRemaining !== undefined && pc.timeRemaining > 0
            ? { ...pc, timeRemaining: pc.timeRemaining - 1 }
            : pc
        )
      );
      setSessions(prevSessions =>
        prevSessions.map(s =>
          s.status === "Active" && s.remainingSeconds !== undefined && s.remainingSeconds > 0
            ? { ...s, remainingSeconds: s.remainingSeconds - 1 }
            : s
        )
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // HANDLER: General PC Status update & initialize play session. Guests
  // (no customerId) go through the real walk-in booking flow (fixed 2hr,
  // matches what "walk-in" means server-side); a selected registered member
  // goes through manual session start with their real userId attached, so
  // suspension is enforced and billing/credits have someone real to point at.
  const handleUpdatePCStatus = async (
    pcId: string,
    status: PCStatus,
    currentUser?: string,
    durationMinutes?: number,
    customerId?: string
  ) => {
    if (!storeId) return;
    const pc = pcs.find(p => p.id === pcId);
    if (!pc) return;

    try {
      if (status === PCStatus.IN_USE && currentUser) {
        if (customerId) {
          await startManualSession(storeId, {
            systemId: pcId,
            userId: customerId,
            notes: `${currentUser} (~${durationMinutes || 60}m)`
          });
          addLog("Session", `Session launched for member ${currentUser} on ${pc.name}`, "success");
        } else {
          await createWalkInBooking(storeId, {
            systemId: pcId,
            notes: currentUser
          });
          addLog("Session", `Walk-in session launched for ${currentUser} on ${pc.name} (2hr standard block)`, "success");
        }
      } else {
        await updateSystem(storeId, pcId, { status: pcStatusToApiStatus(status) });
        addLog("PC", `${pc.name} set to ${status} state.`, status === PCStatus.MAINTENANCE ? "warning" : "info");
      }
      await refreshLiveData();
    } catch (err) {
      addLog("System", `Failed to update ${pc.name}: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  // HANDLER: Force stop active terminal session
  const handleStopSession = async (pcId: string, operatorMessage?: string) => {
    if (!storeId) return;
    const pc = pcs.find(p => p.id === pcId);
    if (!pc || !pc.activeSessionId) return;

    try {
      await endSession(storeId, pc.activeSessionId);
      addLog("Session", operatorMessage || `Session on ${pc.name} released manually.`, "info");
      await refreshLiveData();
    } catch (err) {
      addLog("System", `Failed to end session on ${pc.name}: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  // HANDLER: Add play time to current session
  const handleExtendSession = async (pcId: string, additionalMinutes: number) => {
    if (!storeId) return;
    const pc = pcs.find(p => p.id === pcId);
    if (!pc || !pc.activeSessionId) return;

    try {
      await extendSession(storeId, pc.activeSessionId, additionalMinutes);
      addLog("Session", `Added +${additionalMinutes}m play time to session on ${pc.name}`, "success");
      await refreshLiveData();
    } catch (err) {
      addLog("System", `Failed to extend session on ${pc.name}: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  // HANDLER: Force-lock / unlock a PC over WebSocket, independent of session
  // state — previously defined in api/systems.ts but never called from any
  // button.
  const handleLockPC = async (pcId: string) => {
    if (!storeId) return;
    const pc = pcs.find(p => p.id === pcId);
    if (!pc) return;
    try {
      const result = await lockSystem(storeId, pcId);
      addLog("PC", result.agentOnline
        ? `Lock command sent to ${pc.name}.`
        : `Lock command queued for ${pc.name} — agent is offline, will apply once it reconnects.`,
        result.agentOnline ? "success" : "warning");
    } catch (err) {
      addLog("System", `Failed to lock ${pc.name}: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const handleUnlockPC = async (pcId: string) => {
    if (!storeId) return;
    const pc = pcs.find(p => p.id === pcId);
    if (!pc) return;
    try {
      const result = await unlockSystem(storeId, pcId);
      addLog("PC", result.agentOnline
        ? `Unlock command sent to ${pc.name}.`
        : `Unlock command queued for ${pc.name} — agent is offline, will apply once it reconnects.`,
        result.agentOnline ? "success" : "warning");
    } catch (err) {
      addLog("System", `Failed to unlock ${pc.name}: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  // HANDLER: Register new customer — real endpoint, name + optional phone
  // only (see customers/service.ts on the backend for why email isn't
  // accepted here: it risks colliding with that person's own future
  // self-service signup).
  const handleRegisterCustomer = async (name: string, phone?: string) => {
    if (!storeId) return;
    try {
      await registerCustomer(storeId, { name, phone });
      addLog("Customer", `New customer profile registered: ${name}`, "success");
      await refreshCustomers();
    } catch (err) {
      addLog("System", `Failed to register customer: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  // HANDLER: Credit top up — real wallet ledger entry
  const handleAddBalance = async (userId: string, amount: number) => {
    if (!storeId) return;
    const customer = customers.find(c => c.userId === userId);
    try {
      await adjustCredits(storeId, {
        userId,
        amount,
        type: "credit",
        description: "Front-desk wallet top-up"
      });
      addLog("Billing", `Credited $${amount.toFixed(2)} to ${customer?.name || userId}'s balance.`, "success");
      await refreshCustomers();
    } catch (err) {
      addLog("System", `Failed to add balance: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  // HANDLER: Suspend/Activate customer — real, enforced server-side (blocks
  // new session starts at this store, see customers/service.ts)
  const handleToggleCustomerStatus = async (userId: string, reason?: string) => {
    if (!storeId) return;
    const customer = customers.find(c => c.userId === userId);
    if (!customer) return;
    try {
      if (customer.isSuspended) {
        await activateCustomer(storeId, userId);
        addLog("Customer", `Account of ${customer.name} reactivated.`, "success");
      } else {
        await suspendCustomer(storeId, userId, reason);
        addLog("Customer", `Account of ${customer.name} suspended.`, "danger");
      }
      await refreshCustomers();
    } catch (err) {
      addLog("System", `Failed to update customer status: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  // HANDLER: Add game to master catalog
  const handleAddGame = async (name: string, genre?: string) => {
    if (!storeId) return;
    try {
      await createGame(storeId, { name, genre });
      addLog("System", `Game added to registry: ${name}`, "success");
      await refreshGames();
    } catch (err) {
      addLog("System", `Failed to add game: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  // HANDLER: Toggle a game's active/offline state in the catalog. There's no
  // admin "force-launch" endpoint on the backend — launches are PC-initiated
  // and logged automatically, not something the dashboard can trigger — so
  // the Launch button stays a local-only visual affordance (clearly not
  // persisted) rather than calling something that doesn't exist.
  const handleUpdateGameStatus = async (gameId: string, isActive: boolean) => {
    if (!storeId) return;
    try {
      await updateGame(storeId, gameId, { isActive });
      addLog("System", `Game ${isActive ? "restored" : "taken offline"}.`, isActive ? "info" : "warning");
      await refreshGames();
    } catch (err) {
      addLog("System", `Failed to update game: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  // HANDLER: Create promotional campaign
  const handleCreateOffer = async (body: Parameters<typeof createCampaign>[1]) => {
    if (!storeId) return;
    try {
      await createCampaign(storeId, body);
      addLog("System", `Published promotion campaign: ${body.name}`, "success");
      await refreshCampaigns();
    } catch (err) {
      addLog("System", `Failed to create campaign: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  // HANDLER: "Delete" a campaign — the backend has no DELETE for campaigns,
  // only status transitions, so this cancels it instead of removing the row.
  const handleDeleteOffer = async (id: string) => {
    if (!storeId) return;
    try {
      await cancelCampaign(storeId, id);
      addLog("System", `Cancelled promotion campaign ID: ${id}`, "info");
      await refreshCampaigns();
    } catch (err) {
      addLog("System", `Failed to cancel campaign: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const handlePauseOffer = async (id: string) => {
    if (!storeId) return;
    try {
      await pauseCampaign(storeId, id);
      addLog("System", `Paused campaign ID: ${id}`, "info");
      await refreshCampaigns();
    } catch (err) {
      addLog("System", `Failed to pause campaign: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const handleResumeOffer = async (id: string) => {
    if (!storeId) return;
    try {
      await resumeCampaign(storeId, id);
      addLog("System", `Resumed campaign ID: ${id}`, "info");
      await refreshCampaigns();
    } catch (err) {
      addLog("System", `Failed to resume campaign: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  // HANDLER: Submit high score — Leaderboard has no backend, stays local
  const handleSubmitScore = (entry: Omit<LeaderboardEntry, "id" | "rank" | "date">) => {
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: `lead-0${leaderboard.length + 1}`,
      rank: leaderboard.length + 1,
      date: new Date().toISOString().split("T")[0]
    };
    setLeaderboard(prev => [...prev, newEntry]);
    addLog("System", `High score logged for ${entry.playerName} in "${entry.gameTitle}" [Value: ${entry.statValue}]`, "success");
  };

  // HANDLER: Save settings — loungeName goes to the real Store, hourly
  // rates go to their System Types individually (see SettingsView, which now
  // renders one input per real system type instead of 4 fixed fields).
  // Everything else here (currency/tax/hours/toggles) has no backend
  // equivalent and stays local-only, same as before this pass.
  const handleSaveSettings = async (
    nextSettings: SystemSettings,
    rateChanges: { systemTypeId: string; hourlyBaseRate: number }[]
  ) => {
    if (!storeId) return;
    setSettings(nextSettings);
    try {
      if (nextSettings.loungeName !== settings.loungeName) {
        await updateStore(storeId, { name: nextSettings.loungeName });
      }
      await Promise.all(
        rateChanges.map(rc => updateSystemTypeRate(storeId, rc.systemTypeId, rc.hourlyBaseRate))
      );
      addLog("System", "Lounge profile and hourly rates updated.", "success");
      await refreshSystemTypes();
    } catch (err) {
      addLog("System", `Failed to save settings: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  // Quick Action triggers
  const handleQuickStartSessionTrigger = () => {
    setActiveTab("live_pcs");
    addLog("System", "Select an available terminal card, click Start, and input details.", "info");
  };

  const handleQuickRegisterCustomerTrigger = () => {
    setActiveTab("customers");
    addLog("System", "Click the 'Register Member' button on the header to create a profile.", "info");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        loungeName={settings.loungeName}
      />

      {/* Main layout container with sidebar offset */}
      <div className="pl-64 min-h-screen flex flex-col transition-all duration-200">

        {/* Top Navbar */}
        <TopNavBar
          pcs={pcs}
          loungeName={settings.loungeName}
          logs={logs}
          onSearch={(query) => setSearchQuery(query)}
          onClearLogs={() => setLogs([])}
        />

        {/* Core application view routing */}
        <main className="flex-1 mt-16 p-8 overflow-y-auto">
          {liveDataError && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3">
              Live PC/session data couldn't be loaded from the server: {liveDataError}
            </div>
          )}

          {activeTab === "dashboard" && (
            <DashboardView
              pcs={pcs}
              customers={customers}
              sessions={sessions}
              games={games}
              setActiveTab={setActiveTab}
              onQuickStartSession={handleQuickStartSessionTrigger}
              onQuickRegisterCustomer={handleQuickRegisterCustomerTrigger}
            />
          )}

          {activeTab === "live_pcs" && (
            <LivePCsView
              pcs={pcs}
              customers={customers}
              systemTypes={systemTypes}
              getHourlyRateForPC={getHourlyRateForPC}
              onUpdatePCStatus={handleUpdatePCStatus}
              onStopSession={handleStopSession}
              onExtendSession={handleExtendSession}
              onLockPC={handleLockPC}
              onUnlockPC={handleUnlockPC}
            />
          )}

          {activeTab === "sessions" && (
            <SessionsView
              sessions={sessions}
              pcs={pcs}
              customers={customers}
              systemTypes={systemTypes}
              settings={settings}
              onStopSession={handleStopSession}
              onStartManualSession={(pcId, name, dur) => {
                handleUpdatePCStatus(pcId, PCStatus.IN_USE, name, dur);
              }}
            />
          )}

          {activeTab === "customers" && (
            <CustomersView
              customers={customers}
              onRegisterCustomer={handleRegisterCustomer}
              onAddBalance={handleAddBalance}
              onToggleStatus={handleToggleCustomerStatus}
            />
          )}

          {activeTab === "games" && (
            <GameLibraryView
              games={games}
              onAddGame={handleAddGame}
              onUpdateGameStatus={handleUpdateGameStatus}
            />
          )}

          {activeTab === "offers" && (
            <OffersView
              campaigns={campaigns}
              onCreateOffer={handleCreateOffer}
              onDeleteOffer={handleDeleteOffer}
              onPauseOffer={handlePauseOffer}
              onResumeOffer={handleResumeOffer}
            />
          )}

          {activeTab === "leaderboard" && (
            <LeaderboardsView
              leaderboard={leaderboard}
              customers={customers}
              games={games}
              onSubmitScore={handleSubmitScore}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              settings={settings}
              systemTypes={systemTypes}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>

      </div>
    </div>
  );
}
