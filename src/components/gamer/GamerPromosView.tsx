import React, { useState, useEffect } from "react";
import {
  Tag,
  Sparkles,
  Flame,
  Clock,
  CheckCircle2,
  Calendar,
  Gift,
  Copy,
  Percent,
  Zap,
  ArrowRight
} from "lucide-react";
import { ApiCampaign } from "../../api/types";
import { listActiveCampaigns, redeemCampaign } from "../../api/campaigns";
import { ApiError } from "../../api/client";

interface GamerPromosViewProps {
  storeId: string;
  onOpenBooking: () => void;
}

export default function GamerPromosView({
  storeId,
  onOpenBooking
}: GamerPromosViewProps) {
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    listActiveCampaigns(storeId)
      .then((res) => {
        setCampaigns(res || []);
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, [storeId]);

  const handleCopyCode = (id: string, name: string) => {
    navigator.clipboard.writeText(name.toUpperCase().replace(/\s+/g, "_"));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getCampaignBadge = (type: string) => {
    switch (type) {
      case "percentage_off":
        return { label: "Discount", color: "bg-pink-500/15 text-pink-400 border-pink-500/30" };
      case "bonus_credits":
        return { label: "Bonus Reload", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
      case "happy_hour":
        return { label: "Happy Hour", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
      case "first_visit":
        return { label: "Welcome Perk", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
      default:
        return { label: "Special Deal", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" };
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      });
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
            <Tag className="w-6 h-6 text-indigo-400" />
            <span>Deals, Promos & Happy Hours</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Exclusive lounge perks, playtime multipliers, and discount offers
          </p>
        </div>

        <button
          onClick={onOpenBooking}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-colors shadow-lg shadow-indigo-600/30"
        >
          Book with Promo
        </button>
      </div>

      {/* Featured Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl space-y-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-pink-400 bg-pink-500/15 border border-pink-500/30 px-3 py-1 rounded-full">
            <Flame className="w-3.5 h-3.5" />
            WEEKDAY HAPPY HOURS
          </span>

          <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
            20% Off All RTX Rigs Monday — Thursday
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Play anytime between 2:00 PM and 6:00 PM on weekdays to enjoy special off-peak hourly rates on standard and VIP stations automatically applied.
          </p>
        </div>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs font-mono rounded-3xl bg-[#0d121f] border border-white/[0.08]">
          Loading active campaigns...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-[#0d121f] border border-white/[0.08] text-slate-400 text-xs font-mono space-y-2">
          <p>No active seasonal voucher codes at this exact moment.</p>
          <p className="text-slate-500">Happy hour rates and loyalty multipliers are active 24/7!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((c) => {
            const badge = getCampaignBadge(c.campaignType);
            const isCopied = copiedId === c.id;

            return (
              <div
                key={c.id}
                className="p-5 rounded-3xl bg-[#0d121f] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border ${badge.color}`}
                    >
                      {badge.label}
                    </span>

                    <span className="text-xs font-mono font-bold text-white">
                      {c.campaignType === "percentage_off"
                        ? `${c.value}% OFF`
                        : `₹${c.value} Value`}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white font-display">{c.name}</h4>
                    {c.description && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {c.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      Valid {formatDate(c.validFrom)} — {formatDate(c.validUntil)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <button
                    onClick={() => handleCopyCode(c.id, c.name)}
                    className="text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isCopied ? "Copied Code!" : "Copy Code"}</span>
                  </button>

                  <button
                    onClick={onOpenBooking}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-colors"
                  >
                    Apply & Book
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
