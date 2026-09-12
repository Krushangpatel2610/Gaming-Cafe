import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  X,
  Wallet,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Copy
} from "lucide-react";
import { getPaymentInfo, requestTopup, ApiPaymentInfo } from "../../api/credits";
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
  storeId,
  currentBalance,
  onTopUpSuccess
}: WalletTopUpModalProps) {
  const [paymentInfo, setPaymentInfo] = useState<ApiPaymentInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [utrReference, setUtrReference] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !storeId) return;
    setLoadingInfo(true);
    getPaymentInfo(storeId)
      .then(setPaymentInfo)
      .catch(() => setPaymentInfo(null))
      .finally(() => setLoadingInfo(false));
  }, [isOpen, storeId]);

  if (!isOpen) return null;

  const presets = [100, 250, 500, 1000, 2000];
  const amountToLoad = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountToLoad || amountToLoad < 10) {
      setError("Minimum top-up amount is ₹10.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await requestTopup(storeId, {
        amount: amountToLoad,
        utrReference: utrReference.trim() || undefined
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not submit your top-up request right now."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setUtrReference("");
    setCustomAmount("");
    setError(null);
    if (submitted) onTopUpSuccess();
    onClose();
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
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Reload Wallet</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Current: ₹{currentBalance.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h4 className="text-white font-bold font-display">Request submitted</h4>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Staff will confirm your ₹{amountToLoad.toFixed(0)} top-up once your payment is verified. Your balance will update automatically.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-colors"
            >
              Got it
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Payment info — where to actually pay */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-white/[0.08] space-y-3">
              <label className="block text-[11px] font-bold uppercase font-mono tracking-wider text-slate-300">
                1. Pay via UPI
              </label>
              {loadingInfo ? (
                <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading payment details...
                </div>
              ) : paymentInfo?.upiQrImage || paymentInfo?.upiId ? (
                <div className="flex items-center gap-3">
                  {paymentInfo.upiQrImage ? (
                    <img
                      src={paymentInfo.upiQrImage}
                      alt="UPI QR"
                      className="w-20 h-20 rounded-lg border border-white/10 object-contain bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg border border-white/10 bg-slate-800 flex items-center justify-center shrink-0">
                      <QrCode className="w-8 h-8 text-slate-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400">Scan or pay to</p>
                    {paymentInfo.upiId && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <p className="text-sm font-mono text-white font-semibold truncate">{paymentInfo.upiId}</p>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(paymentInfo.upiId || "")}
                          className="text-slate-500 hover:text-white shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Payment details aren't set up yet — ask staff how to pay before submitting.
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[11px] font-bold uppercase font-mono tracking-wider text-slate-300 mb-2">
                2. Amount you paid
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {presets.map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount("");
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      selectedAmount === amt && !customAmount
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30 font-bold"
                        : "bg-slate-900 border-white/[0.08] text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <p className="text-sm font-mono font-bold">₹{amt}</p>
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="10"
                step="10"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Or enter custom amount..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/[0.1] text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* UTR reference */}
            <div>
              <label className="block text-[11px] font-bold uppercase font-mono tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                <span>3. UPI Reference / UTR</span>
                <span className="text-[10px] text-slate-500 font-normal">Optional, helps staff verify faster</span>
              </label>
              <input
                type="text"
                value={utrReference}
                onChange={(e) => setUtrReference(e.target.value)}
                placeholder="e.g. 12-digit UTR from your UPI app"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/[0.1] text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>Pay first, then submit. Staff confirms your payment before credits are added — this isn't instant.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
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
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit ₹{amountToLoad.toFixed(0)} Request</span>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
