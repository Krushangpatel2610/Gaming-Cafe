import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Tag,
  Plus,
  Calendar,
  Trash2,
  Pause,
  Play,
  Users
} from "lucide-react";
import { ApiCampaign, ApiCampaignType } from "../api/types";
import { CreateCampaignBody } from "../api/campaigns";

interface OffersViewProps {
  campaigns: ApiCampaign[];
  onCreateOffer: (body: CreateCampaignBody) => void;
  onDeleteOffer: (id: string) => void;
  onPauseOffer?: (id: string) => void;
  onResumeOffer?: (id: string) => void;
}

const CAMPAIGN_TYPE_LABELS: Record<ApiCampaignType, string> = {
  percentage_off: "Percentage off",
  fixed_off: "Fixed amount off",
  bonus_minutes: "Bonus minutes",
  bonus_credits: "Bonus credits",
  happy_hour: "Happy hour",
  first_visit: "First-visit offer"
};

export default function OffersView({ campaigns, onCreateOffer, onDeleteOffer, onPauseOffer, onResumeOffer }: OffersViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form states for creating a campaign
  const [name, setName] = useState<string>("");
  const [description, setDesc] = useState<string>("");
  const [campaignType, setCampaignType] = useState<ApiCampaignType>("percentage_off");
  const [value, setValue] = useState<number>(20);
  const [validFrom, setValidFrom] = useState<string>("");
  const [validUntil, setValidUntil] = useState<string>("");
  const [maxRedemptions, setMaxRedemptions] = useState<string>("");

  const filteredCampaigns = campaigns.filter(c => selectedStatus === "All" || c.status === selectedStatus);

  const handleCreateOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const today = new Date().toISOString();
    const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();

    onCreateOffer({
      name,
      description: description || undefined,
      campaignType,
      value,
      validFrom: validFrom ? new Date(validFrom).toISOString() : today,
      validUntil: validUntil ? new Date(validUntil).toISOString() : nextMonth,
      maxRedemptions: maxRedemptions ? parseInt(maxRedemptions) : undefined
    });

    setShowCreateModal(false);
    setName("");
    setDesc("");
    setCampaignType("percentage_off");
    setValue(20);
    setValidFrom("");
    setValidUntil("");
    setMaxRedemptions("");
  };

  const statusBadgeColors: Record<string, string> = {
    draft: "bg-amber-50 text-amber-700 border-amber-200",
    scheduled: "bg-indigo-50 text-indigo-700 border-indigo-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paused: "bg-slate-100 text-slate-500 border-slate-200",
    expired: "bg-slate-100 text-slate-400 border-slate-200",
    cancelled: "bg-red-50 text-red-700 border-red-200"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Promotional Campaigns</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real campaigns players can redeem — discounts, bonus credits, and happy-hour pricing.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Campaign</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="flex bg-white p-2 rounded-lg border border-slate-200 text-xs w-fit flex-wrap gap-1">
        {["All", "draft", "scheduled", "active", "paused", "expired", "cancelled"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3 py-1.5 rounded-md font-medium transition-all capitalize ${
              selectedStatus === st
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            {st === "All" ? "All" : st}
          </button>
        ))}
      </div>

      {/* Grid layout of Campaigns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCampaigns.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
            No campaigns match this filter — create one to get started.
          </div>
        ) : (
          filteredCampaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden flex flex-col hover:border-slate-300 transition-all"
            >
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold border rounded-full capitalize ${statusBadgeColors[camp.status] || ""}`}>
                      {camp.status}
                    </span>
                    <div className="flex items-center gap-1">
                      {camp.status === "active" && onPauseOffer && (
                        <button onClick={() => onPauseOffer(camp.id)} className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Pause campaign">
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {camp.status === "paused" && onResumeOffer && (
                        <button onClick={() => onResumeOffer(camp.id)} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Resume campaign">
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteOffer(camp.id)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Cancel campaign (no hard delete on the backend)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{camp.name}</h3>
                  {camp.description && <p className="text-xs text-slate-500 font-medium line-clamp-2">{camp.description}</p>}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">{CAMPAIGN_TYPE_LABELS[camp.campaignType]}</span>
                      <span className="font-mono font-bold text-slate-800 truncate block">{camp.value}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 shrink-0">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-mono text-[11px]">{camp.currentRedemptions}{camp.maxRedemptions ? `/${camp.maxRedemptions}` : ""}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Validity: {new Date(camp.validFrom).toLocaleDateString()} to {new Date(camp.validUntil).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: Create Campaign */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">Create Promotion Campaign</h3>
              <p className="text-xs text-slate-400 mt-1">Starts as a draft — you'll still need to publish/schedule it separately if your backend requires an explicit activation step.</p>
            </div>

            <form onSubmit={handleCreateOfferSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                  placeholder="e.g. VIP Wednesday Special"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Description (optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 resize-none transition-all"
                  placeholder="Summarize the offer..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Campaign Type</label>
                  <select
                    value={campaignType}
                    onChange={(e) => setCampaignType(e.target.value as ApiCampaignType)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 cursor-pointer transition-all"
                  >
                    {Object.entries(CAMPAIGN_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Value</label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                    placeholder="e.g. 20 (means 20% or 20 units, per type)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Valid From</label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Valid Until</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Max Redemptions (optional)</label>
                <input
                  type="number"
                  min="1"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                  placeholder="Leave blank for unlimited"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/10"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
