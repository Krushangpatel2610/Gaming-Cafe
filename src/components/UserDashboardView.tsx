import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, AlertCircle, ShieldAlert, Send, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUserDashboard } from "../api/user";
import { listAvailableSystems } from "../api/systems";
import { getMyLoyaltyBalance } from "../api/loyalty";
import { listActiveCampaigns } from "../api/campaigns";
import { listActiveSystemTypes } from "../api/systemTypes";
import { listActiveStores } from "../api/stores";
import { getMyNotifications } from "../api/notifications";
import { getSuspensionStatus, submitSuspensionAppeal } from "../api/customers";
import {
  ApiUserDashboard,
  ApiAvailableSystem,
  ApiCampaign,
  ApiSystemType,
  ApiStore
} from "../api/types";
import { ApiError } from "../api/client";

// Gamer Modular Components
import GamerHeader from "./gamer/GamerHeader";
import GamerNav, { GamerTabId } from "./gamer/GamerNav";
import GamerCommandCenter from "./gamer/GamerCommandCenter";
import GamerStationsView from "./gamer/GamerStationsView";
import GamerBookingsView from "./gamer/GamerBookingsView";
import GamerGameVaultView from "./gamer/GamerGameVaultView";
import GamerWalletRewardsView from "./gamer/GamerWalletRewardsView";
import GamerPromosView from "./gamer/GamerPromosView";

// Modals
import StationBookingModal from "./gamer/StationBookingModal";
import StationUnlockModal from "./gamer/StationUnlockModal";
import WalletTopUpModal from "./gamer/WalletTopUpModal";
import GamerNotificationsModal from "./gamer/GamerNotificationsModal";

export default function UserDashboardView() {
  const { user, userStoreId, userLogout } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<GamerTabId>("command");

  // Core Data States
  const [dashboard, setDashboard] = useState<ApiUserDashboard | null>(null);
  const [systems, setSystems] = useState<ApiAvailableSystem[]>([]);
  const [systemTypes, setSystemTypes] = useState<ApiSystemType[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<ApiCampaign[]>([]);
  const [loyaltyBalance, setLoyaltyBalance] = useState<number>(0);
  const [storeProfile, setStoreProfile] = useState<ApiStore | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  // Suspension & Appeal States
  const [suspension, setSuspension] = useState<{
    isSuspended: boolean;
    reason: string | null;
    appealStatus: string | null;
    appealText: string | null;
    appealResponse: string | null;
  } | null>(null);
  const [appealInput, setAppealInput] = useState<string>("");
  const [submittingAppeal, setSubmittingAppeal] = useState<boolean>(false);
  const [appealSuccessMsg, setAppealSuccessMsg] = useState<string | null>(null);

  // Loading & Error States
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [selectedBookingSystem, setSelectedBookingSystem] = useState<ApiAvailableSystem | null>(null);
  const [unlockModalOpen, setUnlockModalOpen] = useState<boolean>(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState<boolean>(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState<boolean>(false);

  // Fetch all primary dashboard data
  const fetchData = useCallback(
    async (silent = false) => {
      if (!userStoreId) return;
      if (!silent) setInitialLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const [dashRes, systemsRes, loyaltyRes, campaignsRes, typesRes, storeRes, notifsRes, suspRes] =
          await Promise.all([
            getUserDashboard(userStoreId),
            listAvailableSystems(userStoreId).catch(() => []),
            getMyLoyaltyBalance(userStoreId).catch(() => ({ balance: 0 })),
            listActiveCampaigns(userStoreId).catch(() => []),
            listActiveSystemTypes(userStoreId).catch(() => []),
            listActiveStores({ limit: 100 })
              .then(({ data }) => data.find((s) => s.id === userStoreId) || null)
              .catch(() => null),
            getMyNotifications(1, 10).catch(() => null),
            getSuspensionStatus(userStoreId).catch(() => null)
          ]);

        setDashboard(dashRes);
        setSystems(systemsRes);
        setLoyaltyBalance(loyaltyRes.balance);
        setActiveCampaigns(campaignsRes);
        setSystemTypes(typesRes);
        if (storeRes) setStoreProfile(storeRes);
        if (notifsRes) setUnreadNotificationsCount(notifsRes.meta?.unreadCount || 0);
        if (suspRes) setSuspension(suspRes);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't connect to gaming lounge server.");
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [userStoreId]
  );

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userStoreId || !appealInput.trim()) return;
    setSubmittingAppeal(true);
    try {
      await submitSuspensionAppeal(userStoreId, appealInput.trim());
      setAppealSuccessMsg("Appeal submitted successfully! Store management will review your request.");
      setSuspension(prev => prev ? { ...prev, appealStatus: "pending", appealText: appealInput.trim() } : null);
      setAppealInput("");
    } catch (err: any) {
      alert(err?.message || "Failed to submit appeal");
    } finally {
      setSubmittingAppeal(false);
    }
  };

  // Initial fetch and 15s auto-poll
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Real-time Session Ticker (smoothly counts down minutes/seconds if session is active)
  useEffect(() => {
    if (!dashboard?.activeSession) return;

    const ticker = setInterval(() => {
      setDashboard((prev) => {
        if (!prev || !prev.activeSession) return prev;
        const remaining = prev.activeSession.timeRemainingMinutes;
        if (remaining <= 0) return prev;
        return {
          ...prev,
          activeSession: {
            ...prev.activeSession,
            timeRemainingMinutes: Math.max(0, remaining)
          }
        };
      });
    }, 60000);

    return () => clearInterval(ticker);
  }, [dashboard?.activeSession]);

  // Handlers for modal actions
  const handleOpenBooking = (sys?: ApiAvailableSystem) => {
    setSelectedBookingSystem(sys || null);
    setBookingModalOpen(true);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#070a12] text-white flex flex-col items-center justify-center p-4">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 animate-pulse">
            <div className="w-full h-full bg-[#090d16] rounded-[14px] flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
            </div>
          </div>
        </div>
        <h3 className="text-base font-bold font-display tracking-tight text-white">
          Initializing Gamer Station
        </h3>
        <p className="text-xs text-slate-400 font-mono mt-1">Connecting to lounge network...</p>
      </div>
    );
  }

  const availableCredits = parseFloat(dashboard?.balance.available ?? "0");
  const currentCredits = parseFloat(dashboard?.balance.current ?? "0");
  const activeSession = dashboard?.activeSession ?? null;
  const loungeName = storeProfile?.name || "10x10 Gaming Zone";

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-200 font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Subtle ambient lighting glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <GamerHeader
        user={user}
        loungeName={loungeName}
        balance={availableCredits}
        loyaltyPoints={loyaltyBalance}
        activeSession={activeSession}
        onOpenTopUp={() => setTopUpModalOpen(true)}
        onOpenUnlock={() => setUnlockModalOpen(true)}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        onRefresh={() => fetchData(true)}
        refreshing={refreshing}
        onLogout={userLogout}
        onSelectTab={(tab) => setActiveTab(tab as GamerTabId)}
      />

      {/* Main Body with Sidebar Navigation */}
      <div className="flex">
        {/* Navigation Sidebar */}
        <GamerNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          hasActiveSession={!!activeSession}
        />

        {/* View Switcher Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pb-24 md:pb-8">
          {suspension?.isSuspended && (
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-red-950/80 border-2 border-red-500/50 p-5 shadow-2xl text-slate-100 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                    <span>Account Suspended at {loungeName}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
                      Restricted
                    </span>
                  </h3>
                  <p className="text-xs text-red-200/90 mt-1">
                    Your account is currently suspended from signing in or starting sessions on physical gaming stations.
                  </p>
                  {suspension.reason && (
                    <div className="mt-2 text-xs bg-black/40 border border-red-500/30 rounded-lg p-2.5 text-red-200">
                      <strong className="text-red-400">Suspension Reason:</strong> {suspension.reason}
                    </div>
                  )}
                </div>
              </div>

              {appealSuccessMsg && (
                <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{appealSuccessMsg}</span>
                </div>
              )}

              {suspension.appealStatus === "pending" ? (
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 text-xs space-y-1">
                  <div className="text-amber-300 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Appeal Under Review</span>
                  </div>
                  <p className="text-amber-200/80">
                    Your statement: "{suspension.appealText}"
                  </p>
                  <p className="text-[11px] text-amber-400/70 pt-1">
                    Store management has been notified. You will receive an update once reviewed.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitAppeal} className="space-y-3 pt-1 border-t border-red-500/20">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                      {suspension.appealStatus === "rejected" ? "Submit Revised Appeal" : "Submit Suspension Appeal"}
                    </label>
                    {suspension.appealResponse && (
                      <p className="text-[11px] text-red-300 italic mb-1">
                        Previous review note: {suspension.appealResponse}
                      </p>
                    )}
                    <textarea
                      required
                      rows={2}
                      value={appealInput}
                      onChange={(e) => setAppealInput(e.target.value)}
                      placeholder="Explain why the suspension should be lifted or what happened..."
                      className="w-full px-3 py-2 bg-black/40 border border-red-500/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingAppeal || !appealInput.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-red-900/30 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingAppeal ? "Submitting..." : "Send Appeal to Staff"}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-bold">Connection Warning</p>
                <p className="text-red-400/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === "command" && (
              <motion.div
                key="command"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <GamerCommandCenter
                  user={user}
                  dashboard={dashboard}
                  systems={systems}
                  systemTypes={systemTypes}
                  loyaltyBalance={loyaltyBalance}
                  activeCampaigns={activeCampaigns}
                  storeId={userStoreId || ""}
                  onOpenBooking={handleOpenBooking}
                  onOpenUnlock={() => setUnlockModalOpen(true)}
                  onOpenTopUp={() => setTopUpModalOpen(true)}
                  onSelectTab={(t) => setActiveTab(t as GamerTabId)}
                  onRefresh={() => fetchData(true)}
                />
              </motion.div>
            )}

            {activeTab === "stations" && (
              <motion.div
                key="stations"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <GamerStationsView
                  systems={systems}
                  systemTypes={systemTypes}
                  onOpenBooking={handleOpenBooking}
                  onOpenUnlock={() => setUnlockModalOpen(true)}
                />
              </motion.div>
            )}

            {activeTab === "bookings" && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <GamerBookingsView
                  storeId={userStoreId || ""}
                  systems={systems}
                  onOpenBooking={() => handleOpenBooking()}
                  onOpenTopUp={() => setTopUpModalOpen(true)}
                  onSessionStarted={() => {
                    fetchData(true);
                    setActiveTab("command");
                  }}
                />
              </motion.div>
            )}

            {activeTab === "vault" && (
              <motion.div
                key="vault"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <GamerGameVaultView
                  systems={systems}
                  onOpenBooking={handleOpenBooking}
                />
              </motion.div>
            )}

            {activeTab === "wallet" && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <GamerWalletRewardsView
                  user={user}
                  storeId={userStoreId || ""}
                  availableCredits={availableCredits}
                  currentCredits={currentCredits}
                  loyaltyBalance={loyaltyBalance}
                  onOpenTopUp={() => setTopUpModalOpen(true)}
                  onBalanceUpdated={() => fetchData(true)}
                />
              </motion.div>
            )}

            {activeTab === "promos" && (
              <motion.div
                key="promos"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <GamerPromosView
                  storeId={userStoreId || ""}
                  onOpenBooking={() => handleOpenBooking()}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Modals */}
      <StationBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        system={selectedBookingSystem}
        systems={systems}
        systemTypes={systemTypes}
        balance={availableCredits}
        storeId={userStoreId || ""}
        onBookingSuccess={() => {
          fetchData(true);
          setActiveTab("bookings");
        }}
        onOpenTopUp={() => {
          setBookingModalOpen(false);
          setTopUpModalOpen(true);
        }}
      />

      <StationUnlockModal
        isOpen={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        systems={systems}
        storeId={userStoreId || ""}
        onUnlockSuccess={() => {
          fetchData(true);
          setActiveTab("command");
        }}
      />

      <WalletTopUpModal
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        userId={user?.id}
        storeId={userStoreId || ""}
        currentBalance={availableCredits}
        onTopUpSuccess={() => fetchData(true)}
      />

      <GamerNotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        onUpdated={() => fetchData(true)}
      />
    </div>
  );
}
