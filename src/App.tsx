import React, { useState, useEffect } from "react";
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
  initialPCs, 
  initialCustomers, 
  initialSessions, 
  initialGames, 
  initialOffers, 
  initialLeaderboards, 
  initialSettings, 
  initialLogs 
} from "./data/mockData";

export default function App() {
  // Core States
  const [pcs, setPCs] = useState<PC[]>(initialPCs);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [games, setGames] = useState<Game[]>(initialGames);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboards);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // BACKGROUND INTERVAL: 1-second ticks for active session timer count-down
  useEffect(() => {
    const timer = setInterval(() => {
      setPCs(prevPCs => {
        return prevPCs.map(pc => {
          if (pc.status === PCStatus.IN_USE && pc.timeRemaining !== undefined) {
            const nextTime = pc.timeRemaining - 1;
            
            // Auto-lock / Completion condition when remaining time hits 0
            if (nextTime <= 0) {
              // Trigger auto-complete on 0
              setTimeout(() => {
                handleStopSession(pc.id, "Auto System Lockout");
              }, 0);
              
              return {
                ...pc,
                status: PCStatus.AVAILABLE,
                currentUser: undefined,
                activeSessionId: undefined,
                timeRemaining: undefined
              };
            }
            return { ...pc, timeRemaining: nextTime };
          }
          return pc;
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pcs]);

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

  // HANDLER: General PC Status update & initialize play session
  const handleUpdatePCStatus = (
    pcId: string, 
    status: PCStatus, 
    currentUser?: string, 
    durationMinutes?: number
  ) => {
    setPCs(prevPCs => prevPCs.map(pc => {
      if (pc.id === pcId) {
        let sessionUpdates = {};
        
        // If transitioning to In-Use, generate a new Session
        if (status === PCStatus.IN_USE && currentUser) {
          const sessionId = `sess-${Date.now().toString().slice(-4)}`;
          const hourlyRate = getHourlyRateForPC(pc.group);
          const totalCost = (durationMinutes || 60) / 60 * hourlyRate;
          
          const newSession: Session = {
            id: sessionId,
            pcId: pc.id,
            pcName: pc.name,
            customerName: currentUser,
            customerId: customers.find(c => c.name === currentUser)?.id,
            startTime: new Date().toISOString(),
            durationMinutes: durationMinutes || 60,
            remainingSeconds: (durationMinutes || 60) * 60,
            ratePerHour: hourlyRate,
            totalCost: parseFloat(totalCost.toFixed(2)),
            status: "Active",
            paymentStatus: "Paid"
          };

          // Append session
          setSessions(prev => [newSession, ...prev]);
          addLog("Session", `Session ${sessionId} launched for ${currentUser} on ${pc.name}`, "success");

          sessionUpdates = {
            currentUser,
            activeSessionId: sessionId,
            timeRemaining: (durationMinutes || 60) * 60,
          };
        } else {
          // General state modification
          addLog("PC", `${pc.name} set to ${status} state.`, status === PCStatus.MAINTENANCE ? "warning" : "info");
        }

        return {
          ...pc,
          status,
          ...sessionUpdates,
          // Reset session values if turning Available/Offline/Maintenance
          ...(status !== PCStatus.IN_USE ? {
            currentUser: undefined,
            activeSessionId: undefined,
            timeRemaining: undefined
          } : {})
        };
      }
      return pc;
    }));
  };

  // HANDLER: Force stop active terminal session
  const handleStopSession = (pcId: string, operatorMessage?: string) => {
    setPCs(prevPCs => prevPCs.map(pc => {
      if (pc.id === pcId && pc.status === PCStatus.IN_USE) {
        const sessId = pc.activeSessionId;
        
        // Update Session record to Completed
        setSessions(prevSess => prevSess.map(s => {
          if (s.id === sessId) {
            return {
              ...s,
              status: "Completed" as const,
              endTime: new Date().toISOString()
            };
          }
          return s;
        }));

        const finalMsg = operatorMessage || `Session ${sessId} on ${pc.name} released manually.`;
        addLog("Session", finalMsg, "info");

        return {
          ...pc,
          status: PCStatus.AVAILABLE,
          currentUser: undefined,
          activeSessionId: undefined,
          timeRemaining: undefined
        };
      }
      return pc;
    }));
  };

  // HANDLER: Add play time to current session
  const handleExtendSession = (pcId: string, additionalMinutes: number) => {
    setPCs(prevPCs => prevPCs.map(pc => {
      if (pc.id === pcId && pc.status === PCStatus.IN_USE) {
        const sessId = pc.activeSessionId;
        
        // Update Session duration & calculations
        setSessions(prevSess => prevSess.map(s => {
          if (s.id === sessId) {
            const nextDuration = s.durationMinutes + additionalMinutes;
            const incrementalCost = (additionalMinutes / 60) * s.ratePerHour;
            return {
              ...s,
              durationMinutes: nextDuration,
              remainingSeconds: (s.remainingSeconds || 0) + (additionalMinutes * 60),
              totalCost: parseFloat((s.totalCost + incrementalCost).toFixed(2))
            };
          }
          return s;
        }));

        addLog("Session", `Added +${additionalMinutes}m play time to session on ${pc.name}`, "success");

        return {
          ...pc,
          timeRemaining: (pc.timeRemaining || 0) + (additionalMinutes * 60)
        };
      }
      return pc;
    }));
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
