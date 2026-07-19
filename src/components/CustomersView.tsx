import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  Award, 
  Clock, 
  UserX, 
  UserCheck,
  ShieldAlert,
  Mail,
  Phone,
  Calendar
} from "lucide-react";
import { Customer } from "../types";

interface CustomersViewProps {
  customers: Customer[];
  onRegisterCustomer: (customer: Omit<Customer, "id" | "registeredAt" | "totalSpend" | "totalPlayTime">) => void;
  onAddBalance: (customerId: string, amount: number) => void;
  onToggleStatus: (customerId: string) => void;
}

export default function CustomersView({ 
  customers, 
  onRegisterCustomer, 
  onAddBalance, 
  onToggleStatus 
}: CustomersViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("All");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [textSearch, setTextSearch] = useState<string>("");

  // Modal states
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [topUpCustId, setTopUpCustId] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<number>(20);

  // Form states for register
  const [regName, setRegName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPhone, setRegPhone] = useState<string>("");
  const [regLevel, setRegLevel] = useState<"Bronze" | "Silver" | "Gold" | "Platinum">("Bronze");
  const [regBalance, setRegBalance] = useState<number>(10);

  const filteredCustomers = customers.filter(c => {
    const matchesTier = selectedTier === "All" || c.membershipLevel === selectedTier;
    const matchesStatus = selectedStatus === "All" || c.status === selectedStatus;
    const matchesText = c.name.toLowerCase().includes(textSearch.toLowerCase()) || 
                        c.email.toLowerCase().includes(textSearch.toLowerCase()) ||
                        c.phone.includes(textSearch);
    return matchesTier && matchesStatus && matchesText;
  });

  const getTierColor = (level: string) => {
    switch (level) {
      case "Platinum":
        return "bg-slate-900 text-slate-100 border-slate-950 shadow-slate-900/10";
      case "Gold":
        return "bg-amber-500 text-white border-amber-600 shadow-amber-500/10";
      case "Silver":
        return "bg-slate-300 text-slate-800 border-slate-400";
      case "Bronze":
      default:
        return "bg-amber-700 text-amber-50 border-amber-800";
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegisterCustomer({
      name: regName,
      email: regEmail,
      phone: regPhone,
      membershipLevel: regLevel,
      balance: regBalance,
      status: "Active"
    });
    // Reset
    setShowRegisterModal(false);
    setRegName("");
    setRegEmail("");
    setRegPhone("");
    setRegLevel("Bronze");
    setRegBalance(10);
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpCustId) return;
    onAddBalance(topUpCustId, topUpAmount);
    setTopUpCustId(null);
    setTopUpAmount(20);
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
          <h2 className="text-xl font-bold text-slate-900 font-display">Customer Profiles & Loyalty Accounts</h2>
          <p className="text-xs text-slate-400 mt-1">
            Register new gamers, update balances, and manage suspension policies.
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Member</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, phone, email address..."
            value={textSearch}
            onChange={(e) => setTextSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        {/* Tier dropdown */}
        <div className="relative">
          <Award className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
          >
            <option value="All">All Loyalty Tiers</option>
            <option value="Platinum">Platinum Level</option>
            <option value="Gold">Gold Level</option>
            <option value="Silver">Silver Level</option>
            <option value="Bronze">Bronze Level</option>
          </select>
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Profile</option>
            <option value="Suspended">Suspended / Banned</option>
          </select>
        </div>
      </div>

      {/* Grid of Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className={`bg-white rounded-xl border p-5 space-y-4 shadow-precision transition-all duration-150 flex flex-col justify-between ${
              cust.status === "Suspended" ? "border-red-200 bg-red-50/10" : "border-slate-200"
            }`}
          >
            {/* Member Card Header */}
            <div className="flex items-center space-x-3.5">
              <img 
                src={cust.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.name)}&background=0D8ABC&color=fff`}
                alt={cust.name} 
                className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-inner"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 truncate">{cust.name}</h3>
                <span className={`inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full font-bold border mt-1 shadow-sm ${getTierColor(cust.membershipLevel)}`}>
                  <Award className="w-3 h-3" />
                  <span>{cust.membershipLevel}</span>
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                cust.status === "Active" 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                  : "bg-red-50 text-red-700 border border-red-100"
              }`}>
                {cust.status}
              </span>
            </div>

            {/* Quick Contact detail info */}
            <div className="space-y-1.5 text-xs text-slate-500 border-t border-b border-slate-100 py-3 font-medium">
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{cust.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{cust.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Registered: {cust.registeredAt}</span>
              </div>
            </div>

            {/* Loyalty Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wide block">Balance</span>
                <span className="text-xs font-bold font-mono text-slate-800">${cust.balance.toFixed(2)}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wide block">Spend</span>
                <span className="text-xs font-bold font-mono text-slate-800">${cust.totalSpend.toFixed(2)}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wide block">Play Time</span>
                <span className="text-xs font-bold font-mono text-slate-800">{cust.totalPlayTime} hrs</span>
              </div>
            </div>

            {/* Custom Admin action buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                disabled={cust.status === "Suspended"}
                onClick={() => setTopUpCustId(cust.id)}
                className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-150 border border-indigo-200/50 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Top-up</span>
              </button>

              <button
                onClick={() => onToggleStatus(cust.id)}
                className={`p-1.5 border rounded-lg transition-colors duration-150 ${
                  cust.status === "Active"
                    ? "bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border-slate-200"
                    : "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                }`}
                title={cust.status === "Active" ? "Suspend member" : "Activate member"}
              >
                {cust.status === "Active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Register Customer */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">Register New Lounge Member</h3>
              <p className="text-xs text-slate-400 mt-1">Assign loyalty tiers and add initial gaming wallet balance.</p>
            </div>
            
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Full Gamer Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                  placeholder="e.g. Gordon Freeman"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email Address</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                    placeholder="name@domain.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Loyalty Tier</label>
                  <select
                    value={regLevel}
                    onChange={(e) => setRegLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 cursor-pointer"
                  >
                    <option value="Bronze">Bronze Level (0% Discount)</option>
                    <option value="Silver">Silver Level (5% Discount)</option>
                    <option value="Gold">Gold Level (10% Discount)</option>
                    <option value="Platinum">Platinum Level (15% Discount)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Opening Wallet Deposit ($)</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    required
                    value={regBalance}
                    onChange={(e) => setRegBalance(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/10"
                >
                  Create Member
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Wallet Top Up */}
      {topUpCustId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 font-display">Top-up Member Account Balance</h3>
              <p className="text-xs text-slate-400 mt-1">Add immediate credits to {customers.find(c => c.id === topUpCustId)?.name}'s profile.</p>
            </div>
            
            <form onSubmit={handleTopUpSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Load Amount</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all ${
                        topUpAmount === amt 
                          ? "bg-indigo-600 border-indigo-700 text-white shadow-sm" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      +${amt}
                    </button>
                  ))}
                </div>
                <div className="pt-2">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTopUpCustId(null)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/10"
                >
                  Load Balance
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
