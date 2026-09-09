import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Sparkles,
  Gift,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  History,
  QrCode,
  Ticket
} from "lucide-react";
import {
  ApiCreditTransaction,
  ApiLoyaltyReward,
  ApiUser
} from "../../api/types";
import { getMyCreditTransactions } from "../../api/credits";
import { listLoyaltyRewards, redeemLoyaltyReward } from "../../api/loyalty";
import { ApiError } from "../../api/client";

interface GamerWalletRewardsViewProps {
  user: ApiUser | null;
  storeId: string;
  availableCredits: number;
  currentCredits: number;
  loyaltyBalance: number;
  onOpenTopUp: () => void;
  onBalanceUpdated: () => void;
}

export default function GamerWalletRewardsView({
  user,
  storeId,
  availableCredits,
  currentCredits,
  loyaltyBalance,
  onOpenTopUp,
  onBalanceUpdated
}: GamerWalletRewardsViewProps) {
  const [activeSection, setActiveSection] = useState<"wallet" | "rewards">("wallet");

  // Transactions State
  const [transactions, setTransactions] = useState<ApiCreditTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState<boolean>(true);

  // Rewards State
  const [rewards, setRewards] = useState<ApiLoyaltyReward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState<boolean>(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!storeId) return;
    setLoadingTx(true);
    try {
      const res = await getMyCreditTransactions(storeId, 1, 30);
      setTransactions(res.data || []);
    } catch {
      setTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  }, [storeId]);

  const fetchRewards = useCallback(async () => {
    if (!storeId) return;
    setLoadingRewards(true);
    try {
      const list = await listLoyaltyRewards(storeId);
      setRewards(list || []);
    } catch {
      setRewards([]);
    } finally {
      setLoadingRewards(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchTransactions();
    fetchRewards();
  }, [fetchTransactions, fetchRewards]);

  const handleRedeem = async (reward: ApiLoyaltyReward) => {
    if (!storeId || redeemingId) return;
    setRedeemingId(reward.id);
    setError(null);
    setRedeemSuccess(null);

    try {
      await redeemLoyaltyReward(storeId, reward.id);
      setRedeemSuccess(
        `Voucher for "${reward.name}" issued! Show this digital screen to front desk staff.`
      );
      fetchRewards();
      onBalanceUpdated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not redeem this reward.");
    } finally {
      setRedeemingId(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return (
        d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
        " · " +
        d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-display tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-indigo-400" />
            <span>Cyber Wallet & Loyalty Rewards</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Store credits, reload transaction ledger, and redeemable lounge prizes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-2xl bg-[#0d121f] border border-white/[0.08]">
            <button
              onClick={() => setActiveSection("wallet")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                activeSection === "wallet"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Wallet & Ledger
            </button>
            <button
              onClick={() => setActiveSection("rewards")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ${
                activeSection === "rewards"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Rewards Store ({rewards.length})
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {redeemSuccess && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>{redeemSuccess}</span>
        </div>
      )}

      {activeSection === "wallet" ? (
        <div className="space-y-6">
          {/* Holographic Cyber Wallet Card & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Holographic Card */}
            <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#0f172a] border border-indigo-500/30 p-6 sm:p-7 relative overflow-hidden shadow-2xl shadow-indigo-950/50 flex flex-col justify-between min-h-[220px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-300 uppercase">
                    10X10 GAMER PASS
                  </span>
                  <p className="text-sm font-bold text-white font-mono mt-0.5">
                    {user?.name || "Player Account"}
                  </p>
                </div>
                <div className="w-10 h-8 rounded-lg bg-amber-400/80 border border-amber-300/40 flex items-center justify-center shadow-inner">
                  <div className="w-6 h-5 border border-amber-600/50 rounded-sm" />
                </div>
              </div>

              <div className="relative z-10 my-4">
                <span className="text-[10px] font-mono uppercase text-indigo-300 tracking-wider">
                  Available Credits
                </span>
                <p className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight mt-0.5">
                  ₹{availableCredits.toFixed(2)}
                </p>
                {Math.abs(currentCredits - availableCredits) > 0.01 && (
                  <p className="text-[11px] font-mono text-indigo-300/80 mt-1">
                    Total Account Balance: ₹{currentCredits.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-mono text-indigo-200">
                  Instant station auto-pay & booking enabled
                </span>
                <button
                  onClick={onOpenTopUp}
                  className="px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-mono font-bold text-xs shadow-lg transition-colors"
                >
                  + Add Funds
                </button>
              </div>
            </div>

            {/* Loyalty Points summary box */}
            <div className="rounded-3xl bg-[#0d121f] border border-white/[0.08] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Loyalty Points
                </span>
                <p className="text-3xl font-extrabold font-mono text-amber-400 mt-1">
                  {loyaltyBalance}
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Earned automatically for every hour spent gaming at the cafe.
                </p>
              </div>

              <button
                onClick={() => setActiveSection("rewards")}
                className="mt-4 w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs transition-colors text-center"
              >
                Browse Reward Store
              </button>
            </div>
          </div>

          {/* Credit Transactions Ledger */}
          <div className="rounded-3xl bg-[#0d121f] border border-white/[0.08] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white font-display">
                  Credit Transactions Ledger
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {transactions.length} Records
              </span>
            </div>

            {loadingTx ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span>Loading ledger entries...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                No credit transactions yet. Top up or book a station to start!
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06] overflow-x-auto">
                {transactions.map((tx) => {
                  const isCredit =
                    tx.transactionType === "earned" ||
                    tx.transactionType === "bonus" ||
                    (tx.transactionType === "admin_adjust" && parseFloat(tx.amount) > 0);

                  return (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-4 text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                            isCredit
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-white uppercase tracking-tight">
                            {tx.description || tx.transactionType.replace("_", " ")}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {formatDate(tx.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            isCredit ? "text-emerald-400" : "text-slate-300"
                          }`}
                        >
                          {isCredit ? "+" : "-"}₹{Math.abs(parseFloat(tx.amount)).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Bal: ₹{parseFloat(tx.balanceAfter).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Rewards Catalog */
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#0d121f] border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">Redeemable Rewards</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Current Balance: <span className="text-amber-400 font-bold">{loyaltyBalance} pts</span>
                </p>
              </div>
            </div>
          </div>

          {loadingRewards ? (
            <div className="py-20 text-center text-slate-500 text-xs font-mono flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Loading rewards...</span>
            </div>
          ) : rewards.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-[#0d121f] border border-white/[0.08] text-slate-400 text-xs font-mono">
              No rewards configured yet. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rewards.map((r) => {
                const canAfford = loyaltyBalance >= r.pointsCost;
                const outOfStock = r.stock !== null && r.stock <= 0;
                const isRedeeming = redeemingId === r.id;

                return (
                  <div
                    key={r.id}
                    className="p-5 rounded-3xl bg-[#0d121f] border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-bold text-white font-display">
                          {r.name}
                        </h4>
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {r.pointsCost} pts
                        </span>
                      </div>

                      {r.description && (
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          {r.description}
                        </p>
                      )}

                      {r.stock !== null && (
                        <p className="text-[10px] font-mono text-slate-500 mt-2">
                          {r.stock > 0 ? `${r.stock} vouchers in stock` : "Currently out of stock"}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleRedeem(r)}
                        disabled={!canAfford || outOfStock || isRedeeming}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-mono font-bold text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-40 flex items-center justify-center gap-1.5"
                      >
                        {isRedeeming ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Claiming...</span>
                          </>
                        ) : outOfStock ? (
                          "Out of Stock"
                        ) : !canAfford ? (
                          `Need ${r.pointsCost - loyaltyBalance} more pts`
                        ) : (
                          <>
                            <Ticket className="w-3.5 h-3.5" />
                            <span>Redeem Reward</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
