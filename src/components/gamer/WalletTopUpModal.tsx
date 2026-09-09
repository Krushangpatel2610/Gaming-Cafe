import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  Wallet,
  Sparkles,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Tag
} from "lucide-react";
import { adjustCredits } from "../../api/credits";
import { ApiError } from "../../api/client";

interface WalletTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  storeId: string;
  currentBalance: number;
  onTopUpSuccess: () => void;
}

export default function WalletTopUpModal({
  isOpen,
  onClose,
  userId,
  storeId,
  currentBalance,
  onTopUpSuccess
}: WalletTopUpModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [promoCode, setPromoCode] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [
    { amount: 100, label: "₹100", bonus: null },
    { amount: 250, label: "₹250", bonus: null },
    { amount: 500, label: "₹500", bonus: "+₹50 Bonus" },
    { amount: 1000, label: "₹1,000", bonus: "+₹150 Bonus" },
    { amount: 2000, label: "₹2,000", bonus: "+₹400 Bonus" }
  ];

  const amountToLoad = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountToLoad || amountToLoad < 10) {
      setError("Minimum top-up amount is ₹10.");
      return;
    }
    if (!userId || !storeId) {
      setError("User or store context missing.");
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      // Top up via admin adjust route or simulated reload
      let bonusAmount = 0;
      if (amountToLoad >= 2000) bonusAmount = 400;
      else if (amountToLoad >= 1000) bonusAmount = 150;
      else if (amountToLoad >= 500) bonusAmount = 50;

      const totalCreditsToAdd = amountToLoad + bonusAmount;

      await adjustCredits(storeId, {
        userId,
        amount: totalCreditsToAdd,
        type: "credit",
        description: `Player Wallet Reload (UPI / Card) ${bonusAmount > 0 ? `incl. ₹${bonusAmount} Bonus` : ""}`
      });

      setSuccess(`Reloaded ₹${totalCreditsToAdd.toFixed(2)} credits to your wallet!`);

      setTimeout(() => {
        onTopUpSuccess();
        onClose();
        setSuccess(null);
      }, 1300);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not complete top-up right now. Please check with staff."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-[#0d121f] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
      >
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Reload Wallet</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Current: ₹{currentBalance.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleTopUp} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-[11px] font-bold uppercase font-mono tracking-wider text-slate-300 mb-2">
              Select Amount
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  type="button"
                  key={p.amount}
                  onClick={() => {
                    setSelectedAmount(p.amount);
                    setCustomAmount("");
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    selectedAmount === p.amount && !customAmount
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30 font-bold"
                      : "bg-slate-900 border-white/[0.08] text-slate-300 hover:border-white/20"
                  }`}
                >
                  <p className="text-sm font-mono font-bold">{p.label}</p>
                  {p.bonus && (
                    <p className="text-[9px] font-mono text-amber-400 font-semibold mt-0.5">
                      {p.bonus}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-[11px] font-bold uppercase font-mono tracking-wider text-slate-300 mb-1.5">
              Or Custom Amount (₹)
            </label>
            <input
              type="number"
              min="10"
              step="10"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/[0.1] text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Promo / Voucher Code */}
          <div>
            <label className="block text-[11px] font-bold uppercase font-mono tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Have a Voucher Code?</span>
              <span className="text-[10px] text-slate-500 font-normal">Optional</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="e.g. VIP50"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/[0.1] text-white text-xs font-mono uppercase placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Payment Method Notice */}
          <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-center gap-2 text-[11px] text-indigo-300">
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>Instant reload via UPI, Card or NetBanking. Credits never expire.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/5 text-xs font-semibold font-mono transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || amountToLoad <= 0}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold font-mono tracking-wider transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-indigo-200" />
                  <span>Pay ₹{amountToLoad.toFixed(0)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
