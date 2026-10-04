import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  CreditCard,
  History,
  QrCode
} from "lucide-react";
import {
  ApiCreditTransaction,
  ApiUser
} from "../../api/types";
import { getMyCreditTransactions } from "../../api/credits";

interface GamerWalletRewardsViewProps {
  user: ApiUser | null;
  storeId: string;
  availableCredits: number;
  currentCredits: number;
  loyaltyBalance?: number;
  onOpenTopUp: () => void;
  onBalanceUpdated: () => void;
}

export default function GamerWalletRewardsView({
  user,
  storeId,
  availableCredits,
  currentCredits,
  onOpenTopUp
}: GamerWalletRewardsViewProps) {
  // Transactions State
  const [transactions, setTransactions] = useState<ApiCreditTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState<boolean>(true);

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

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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
            <span>Cyber Wallet</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Store credits, reload transaction ledger, and payment balances
          </p>
        </div>

        <button
          onClick={onOpenTopUp}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4" />
          <span>Top Up Credits</span>
        </button>
      </div>

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

            {/* Store Credits & Top-Up Summary Box */}
            <div className="rounded-3xl bg-[#0d121f] border border-white/[0.08] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-3">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Store Credits
                </span>
                <p className="text-3xl font-extrabold font-mono text-white mt-1">
                  ₹{availableCredits.toFixed(2)}
                </p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Use credits to instantly unlock PC rigs and pay for food or beverage orders.
                </p>
              </div>

              <button
                onClick={onOpenTopUp}
                className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-xs transition-colors text-center"
              >
                + Top Up Wallet
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
      </div>
  );
}
