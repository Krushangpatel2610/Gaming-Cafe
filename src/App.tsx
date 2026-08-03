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
import { listLiveSystems, updateSystem } from "./api/systems";
import { listSessions, startManualSession, endSession, extendSession } from "./api/sessions";
import { adaptSystemToPC, adaptSessionToUI, pcStatusToApiStatus } from "./api/adapters";

import {
  PC,
  PCStatus,
  PCGroup,
  Customer,
  Session,
  Game,
  Offer,
  LeaderboardEntry,
  SystemSettings,
  ActivityLog
} from "./types";

import {
  initialCustomers,
  initialGames,
  initialOffers,
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
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [games, setGames] = useState<Game[]>(initialGames);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
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

  // Helper hourly calculator logic
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

  // LIVE DATA: pulls Systems + Sessions from the real backend (Parts 7 & 9/10 of the API reference)
  const refreshLiveData = useCallback(async () => {
    if (!storeId) return;
    try {
      const [systems, allSessions] = await Promise.all([
        listLiveSystems(storeId),
        listSessions(storeId, { limit: 100 })
      ]);

      const activeSessionBySystem = new Map(
        allSessions.filter(s => s.status === "in_progress").map(s => [s.systemId, s])
      );
      const nextPCs = systems.map(sys => adaptSystemToPC(sys, activeSessionBySystem.get(sys.id)));
      setPCs(nextPCs);

      const nextSessions = allSessions.map(s => {
        const pc = nextPCs.find(p => p.id === s.systemId);
        const rate = pc ? getHourlyRateForPC(pc.group) : settings.standardRate;
        // The backend doesn't expose a display name for a session's player — only a
        // userId (no admin "get user" endpoint exists yet) or a walk-in phone number.
        const customerName = s.walkInPhone || (s.userId ? `Member ${s.userId.slice(0, 6)}` : "Guest");
        return adaptSessionToUI(s, pc?.name || s.systemId, rate, customerName);
      });
      setSessions(nextSessions);
      setLiveDataError(null);
    } catch (err) {
      setLiveDataError(err instanceof ApiError ? err.message : "Failed to load live data from the server.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, settings]);

  useEffect(() => {
    if (!storeId) return;
    refreshLiveData();
    const interval = setInterval(refreshLiveData, 6000);
    return () => clearInterval(interval);
  }, [storeId, refreshLiveData]);

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

  // BACKGROUND INTERVAL: Game downloads / update simulation
  useEffect(() => {
    const updater = setInterval(() => {
      setGames(prevGames => {
        let changed = false;
        const nextGames = prevGames.map(game => {
          if (game.status === "Updating" && game.updateProgress !== undefined) {
            changed = true;
            const nextProgress = game.updateProgress + Math.floor(Math.random() * 15) + 5;
            if (nextProgress >= 100) {
              // Trigger final success logging in timeout to prevent React update loops
              setTimeout(() => {
                addLog("System", `Game files for "${game.title}" successfully updated and ready.`, "success");
              }, 0);
              return { ...game, status: "Ready" as const, updateProgress: undefined };
            }
            return { ...game, updateProgress: nextProgress };
          }
          return game;
        });
        return changed ? nextGames : prevGames;
      });
    }, 4000);

    return () => clearInterval(updater);
  }, []);

  // HANDLER: General PC Status update & initialize play session (now backed by real Systems/Sessions API)
  const handleUpdatePCStatus = async (
    pcId: string,
    status: PCStatus,
    currentUser?: string,
    durationMinutes?: number
  ) => {
    if (!storeId) return;
    const pc = pcs.find(p => p.id === pcId);
    if (!pc) return;

    try {
      if (status === PCStatus.IN_USE && currentUser) {
        // Customer records are still local-only in this pass (no admin "create user"
        // endpoint exists on the backend), so the chosen name/duration can't be attached
        // as a real userId/booking length yet — passed through as notes for now.
        await startManualSession(storeId, {
          systemId: pcId,
          notes: `${currentUser} (~${durationMinutes || 60}m)`
        });
        addLog("Session", `Session launched for ${currentUser} on ${pc.name}`, "success");
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

  // HANDLER: Register new Member Profile
  const handleRegisterCustomer = (newCust: Omit<Customer, "id" | "registeredAt" | "totalSpend" | "totalPlayTime">) => {
    const custId = `cust-${Math.floor(10 + Math.random() * 90)}`;
    const today = new Date().toISOString().split("T")[0];

    const customerRecord: Customer = {
      ...newCust,
      id: custId,
      totalSpend: newCust.balance, // initial loaded balance is part of initial spend/load
      totalPlayTime: 0,
      registeredAt: today
    };

    setCustomers(prev => [...prev, customerRecord]);
    addLog("Customer", `New membership profile registered: ${newCust.name} (${newCust.membershipLevel})`, "success");
  };

  // HANDLER: Credit top up
  const handleAddBalance = (customerId: string, amount: number) => {
    setCustomers(prevCust => prevCust.map(c => {
      if (c.id === customerId) {
        addLog("Billing", `Credited $${amount.toFixed(2)} to ${c.name}'s balance account.`, "success");
        return {
          ...c,
          balance: c.balance + amount,
          totalSpend: c.totalSpend + amount
        };
      }
      return c;
    }));
  };

  // HANDLER: Suspend/Activate customer
  const handleToggleCustomerStatus = (customerId: string) => {
    setCustomers(prevCust => prevCust.map(c => {
      if (c.id === customerId) {
        const nextStatus = c.status === "Active" ? "Suspended" as const : "Active" as const;
        addLog("Customer", `Account of ${c.name} is now ${nextStatus}`, nextStatus === "Suspended" ? "danger" : "success");
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  // HANDLER: Game launch counters
  const handleLaunchGame = (gameId: string) => {
    setGames(prevGames => prevGames.map(g => {
      if (g.id === gameId) {
        addLog("System", `Game directory launched: ${g.title} on terminal server`, "success");
        return {
          ...g,
          launchCount: g.launchCount + 1,
          playTimeHours: g.playTimeHours + 2 // simulate playtime increase
        };
      }
      return g;
    }));
    alert("Application Launcher activated! Starting game on designated terminal.");
  };

  // HANDLER: Game status update
  const handleUpdateGameStatus = (gameId: string, status: "Ready" | "Updating" | "Offline") => {
    setGames(prevGames => prevGames.map(g => {
      if (g.id === gameId) {
        addLog("System", `Game "${g.title}" status flagged as ${status}`, status === "Offline" ? "warning" : "info");
        return {
          ...g,
          status,
          updateProgress: status === "Updating" ? 10 : undefined
        };
      }
      return g;
    }));
  };

  // HANDLER: Create coupon campaign
  const handleCreateOffer = (newOff: Omit<Offer, "id">) => {
    const offerId = `off-0${offers.length + 1}`;
    setOffers(prev => [{ ...newOff, id: offerId }, ...prev]);
    addLog("System", `Published promotion voucher: ${newOff.title} [Code: ${newOff.code}]`, "success");
  };

  // HANDLER: Remove coupon campaign
  const handleDeleteOffer = (id: string) => {
    setOffers(prev => prev.filter(off => off.id !== id));
    addLog("System", `Withdrew promotion campaign ID: ${id}`, "info");
  };

  // HANDLER: Submit high score
  const handleSubmitScore = (entry: Omit<LeaderboardEntry, "id" | "rank" | "date">) => {
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: `lead-0${leaderboard.length + 1}`,
      rank: leaderboard.length + 1,
      date: new Date().toISOString().split("T")[0]
    };

    // Prepend and sort by ranking placeholder order
    setLeaderboard(prev => [...prev, newEntry]);
    addLog("System", `High score logged for ${entry.playerName} in "${entry.gameTitle}" [Value: ${entry.statValue}]`, "success");
  };

  // HANDLER: Save System Settings Config
  const handleSaveSettings = (nextSettings: SystemSettings) => {
    setSettings(nextSettings);
    addLog("System", "Lounge pricing rates & locking policy updated.", "success");
  };

  // Quick Action triggers
  const handleQuickStartSessionTrigger = () => {
    setActiveTab("live_pcs");
    // Auto alerts
    addLog("System", "Select an available terminal card, click Start, and input details.", "info");
  };

  const handleQuickRegisterCustomerTrigger = () => {
    setActiveTab("customers");
    // Add instruction
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
              settings={settings}
              onUpdatePCStatus={handleUpdatePCStatus}
              onStopSession={handleStopSession}
              onExtendSession={handleExtendSession}
            />
          )}

          {activeTab === "sessions" && (
            <SessionsView 
              sessions={sessions}
              pcs={pcs}
              customers={customers}
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
              onAddGame={handleRegisterCustomer as any} // we reuse handler for addition mapping
              onLaunchGame={handleLaunchGame}
              onUpdateGameStatus={handleUpdateGameStatus}
            />
          )}

          {activeTab === "offers" && (
            <OffersView 
              offers={offers}
              onCreateOffer={handleCreateOffer}
              onDeleteOffer={handleDeleteOffer}
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
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>

      </div>
    </div>
  );
}
