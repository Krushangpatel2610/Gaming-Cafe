import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Tag, 
  Plus, 
  Calendar, 
  Sparkles, 
  Percent, 
  Copy, 
  Check, 
  Trash2,
  Clock,
  ExternalLink,
  DollarSign
} from "lucide-react";
import { Offer } from "../types";

interface OffersViewProps {
  offers: Offer[];
  onCreateOffer: (offer: Omit<Offer, "id">) => void;
  onDeleteOffer: (id: string) => void;
}

export default function OffersView({ offers, onCreateOffer, onDeleteOffer }: OffersViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form states for creating promotion
  const [title, setTitle] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [badge, setBadge] = useState<string>("HOT DEAL");
  const [discountType, setDiscountType] = useState<"Percentage" | "HourlyRate" | "Bundle">("Percentage");
  const [value, setValue] = useState<string>("20% Off");
  const [code, setCode] = useState<string>("");
  const [status, setStatus] = useState<"Active" | "Upcoming" | "Draft">("Active");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");

  const filteredOffers = offers.filter(off => {
    return selectedStatus === "All" || off.status === selectedStatus;
  });

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 1500);
  };

  const handleCreateOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Default dates if empty
    const today = new Date().toISOString().split("T")[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0];

    // Pick standard campaign wallpaper
    const defaultImages = [
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1553481187-be93c21490a9?w=500&auto=format&fit=crop&q=80"
    ];
    const randomImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];

    onCreateOffer({
      title,
      description: desc,
      badge: badge.toUpperCase(),
      discountType,
      value,
      code: code.toUpperCase() || "PROMO",
      imageUrl: randomImage,
      status: status as any,
      startDate: start || today,
      endDate: end || nextMonth
    });

    // Reset
    setShowCreateModal(false);
    setTitle("");
    setDesc("");
    setBadge("HOT DEAL");
    setDiscountType("Percentage");
    setValue("20% Off");
    setCode("");
    setStatus("Active");
    setStart("");
    setEnd("");
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
          <h2 className="text-xl font-bold text-slate-900 font-display">Special Offers & Campaign Deals</h2>
          <p className="text-xs text-slate-400 mt-1">
            Build hourly discounts, first-time match promotions, and night-owl game bundles.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promotion</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="flex bg-white p-2 rounded-lg border border-slate-200 text-xs w-fit">
        {["All", "Active", "Upcoming", "Expired"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-4 py-1.5 rounded-md font-medium transition-all ${
              selectedStatus === st
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            {st === "All" ? "All Offers" : st}
          </button>
        ))}
      </div>

      {/* Grid layout of Campaigns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOffers.map((off) => {
          
          const statusBadgeColors = {
            Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
            Upcoming: "bg-indigo-50 text-indigo-700 border-indigo-200",
            Expired: "bg-slate-100 text-slate-500 border-slate-200",
            Draft: "bg-amber-50 text-amber-700 border-amber-200"
          };

          return (
            <div
              key={off.id}
              className="bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden flex flex-col md:flex-row hover:border-slate-300 transition-all group"
            >
              {/* Campaign Poster Image */}
              <div className="relative w-full md:w-48 h-40 md:h-auto bg-slate-900 overflow-hidden shrink-0">
                <img 
                  src={off.imageUrl} 
                  alt={off.title} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-950/20" />
                
                {/* Promo Badge type */}
                <div className="absolute top-3 left-3 bg-red-600 text-white font-bold text-[9px] tracking-wider px-2 py-0.5 rounded-full uppercase shadow-md">
                  {off.badge}
                </div>
              </div>

              {/* Offer contents details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold border rounded-full ${statusBadgeColors[off.status]}`}>
                      {off.status}
                    </span>
                    <button
                      onClick={() => onDeleteOffer(off.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Archive campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{off.title}</h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2">{off.description}</p>
                </div>

                {/* Voucher code / values section */}
                <div className="space-y-3">
                  {/* Code and Values */}
                  <div className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Voucher Code:</span>
                      <span className="font-mono font-bold text-slate-800 truncate block">{off.code}</span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(off.id, off.code)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all shrink-0 flex items-center space-x-1 border ${
                        copiedCodeId === off.id
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {copiedCodeId === off.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCodeId === off.id ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  {/* Dates duration */}
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Validity: {off.startDate} to {off.endDate}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Create Offer */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">Create Promotion Campaign</h3>
              <p className="text-xs text-slate-400 mt-1">Design special discounted tariffs and configure public codes.</p>
            </div>
            
            <form onSubmit={handleCreateOfferSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Promotion Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                  placeholder="e.g. VIP Wednesday Special"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Description / Subtitle</label>
                <textarea
                  required
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 resize-none transition-all"
                  placeholder="Summarize voucher requirements..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Badge Banner (e.g. 50% Off)</label>
                  <input
                    type="text"
                    required
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Voucher Promo Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                    placeholder="e.g. VIPWED50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 cursor-pointer transition-all"
                  >
                    <option value="Percentage">Percentage discount</option>
                    <option value="HourlyRate">Hourly rate override</option>
                    <option value="Bundle">Pre-purchased bundle</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Tariff value description</label>
                  <input
                    type="text"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                    placeholder="e.g. 25% discount"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Start Date</label>
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">End Date</label>
                  <input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                  />
                </div>
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
                  Publish Campaign
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
