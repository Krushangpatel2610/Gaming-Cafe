import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Clock, 
  Play, 
  History, 
  Calculator, 
  DollarSign, 
  Plus, 
  CheckCircle,
  FileText,
  Percent,
  Search,
  Check
} from "lucide-react";
import { Session, PC, PCStatus, Customer, SystemSettings, PCGroup } from "../types";

interface SessionsViewProps {
  sessions: Session[];
  pcs: PC[];
  customers: Customer[];
  settings: SystemSettings;
  onStopSession: (pcId: string) => void;
  onStartManualSession: (pcId: string, customerName: string, durationMinutes: number) => void;
}

export default function SessionsView({
  sessions,
  pcs,
  customers,
  settings,
  onStopSession,
  onStartManualSession
}: SessionsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"active" | "history" | "calculator">("active");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Calculator state
  const [calcZone, setCalcZone] = useState<PCGroup>(PCGroup.STANDARD);
  const [calcTier, setCalcTier] = useState<string>("None");
  const [calcHours, setCalcHours] = useState<number>(3);
  const [calcTax, setCalcTax] = useState<boolean>(true);

  // Computations for active sessions
  const activeSessions = sessions.filter(s => s.status === "Active");
  const completedSessions = sessions.filter(s => s.status === "Completed" || s.status === "Cancelled");

  const filteredActive = activeSessions.filter(s => 
    s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.pcName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = completedSessions.filter(s => 
    s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.pcName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper pricing calculation
  const getZoneRate = (zone: PCGroup) => {
    switch (zone) {
      case PCGroup.VIP: return settings.vipRate;
      case PCGroup.STANDARD: return settings.standardRate;
      case PCGroup.CONSOLE: return settings.consoleRate;
      case PCGroup.STREAMING: return settings.streamingRate;
    }
  };

  const getTierDiscount = (tier: string) => {
    switch (tier) {
      case "Silver": return 0.05; // 5%
      case "Gold": return 0.10; // 10%
      case "Platinum": return 0.15; // 15%
      default: return 0.00;
    }
  };

  // Calculator computations
  const hourlyRate = getZoneRate(calcZone);
  const rawSubtotal = hourlyRate * calcHours;
  const discountRate = getTierDiscount(calcTier);
  const discountAmount = rawSubtotal * discountRate;
  const subtotalAfterDiscount = rawSubtotal - discountAmount;
  const taxRate = calcTax ? settings.taxRate / 100 : 0;
  const taxAmount = subtotalAfterDiscount * taxRate;
  const finalTotal = subtotalAfterDiscount + taxAmount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Tab Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display font-display">Sessions & Billing</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track currently active logins, access completion receipts, and calculate bulk booking discount rates.
          </p>
        </div>
        
        {/* Sub-tab toggles */}
        <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab("active")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeSubTab === "active"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-slate-500" />
            <span>Active Sessions ({activeSessions.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeSubTab === "history"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Session History</span>
          </button>
          <button
            onClick={() => setActiveSubTab("calculator")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeSubTab === "calculator"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Pricing Calculator</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR (except for Calculator) */}
      {activeSubTab !== "calculator" && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer name, terminal ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
      )}

      {/* Tab: ACTIVE SESSIONS */}
      {activeSubTab === "active" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Current Running System Sessions</h3>
            <p className="text-xs text-slate-400">Manage real-time logins and force logout active gamers if required.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold font-mono uppercase tracking-wider text-[10px] bg-slate-50/30">
                  <th className="p-4">PC ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Hourly Rate</th>
                  <th className="p-4">Start Time</th>
                  <th className="p-4">Time Left</th>
                  <th className="p-4 text-right">Running Charge</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredActive.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No active sessions match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredActive.map((sess) => {
                    const formatTimeLeft = (secs?: number) => {
                      if (secs === undefined) return "Infinite";
                      const h = Math.floor(secs / 3600);
                      const m = Math.floor((secs % 3600) / 60);
                      return `${h}h ${m}m remaining`;
                    };

                    const isUrgent = sess.remainingSeconds !== undefined && sess.remainingSeconds < 600;

                    return (
                      <tr key={sess.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold font-mono text-indigo-600">{sess.pcName}</td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{sess.customerName}</div>
                          {sess.customerId && <div className="text-[10px] text-slate-400 font-mono">{sess.customerId}</div>}
                        </td>
                        <td className="p-4 font-mono text-slate-600">${sess.ratePerHour.toFixed(2)}/hr</td>
                        <td className="p-4 text-slate-500 font-mono">
                          {new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isUrgent 
                              ? "bg-red-50 text-red-700 border-red-100 animate-pulse" 
                              : "bg-indigo-50 text-indigo-700 border-indigo-100"
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeLeft(sess.remainingSeconds)}</span>
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-slate-900 font-mono">
                          ${sess.totalCost.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => onStopSession(sess.pcId)}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-bold transition-all"
                          >
                            Release
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: SESSION HISTORY */}
      {activeSubTab === "history" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">Completed Sessions Archive</h3>
            <p className="text-xs text-slate-400">Auditable logs of logged-out clients, final invoices, and payment statuses.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold font-mono uppercase tracking-wider text-[10px] bg-slate-50/30">
                  <th className="p-4">Session ID</th>
                  <th className="p-4">Terminal</th>
                  <th className="p-4">Gamer Profile</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Hourly Rate</th>
                  <th className="p-4 text-right">Total Invoice</th>
                  <th className="p-4 text-center">Billing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No historical sessions recorded.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((sess) => {
                    const formatDate = (isoString: string) => {
                      const d = new Date(isoString);
                      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    };

                    return (
                      <tr key={sess.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono text-[11px] text-slate-500">{sess.id}</td>
                        <td className="p-4 font-bold text-slate-800">{sess.pcName}</td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{sess.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Started: {formatDate(sess.startTime)}</div>
                        </td>
                        <td className="p-4 text-slate-600 font-mono">{sess.durationMinutes} minutes</td>
                        <td className="p-4 font-mono text-slate-500">${sess.ratePerHour.toFixed(2)}/hr</td>
                        <td className="p-4 text-right font-bold text-slate-900 font-mono">
                          ${sess.totalCost.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Paid</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: PRICING CALCULATOR */}
      {activeSubTab === "calculator" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Controls Box */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-precision space-y-5">
            <h3 className="text-base font-bold text-slate-800 font-display">Simulated Booking Parameters</h3>
            <p className="text-xs text-slate-400">Adjust the configurations to produce an estimated receipt for group reserves or custom promotions.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Select PC Group */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Lounge PC Zone</label>
                <select
                  value={calcZone}
                  onChange={(e) => setCalcZone(e.target.value as PCGroup)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 cursor-pointer"
                >
                  <option value={PCGroup.VIP}>VIP Zone (${settings.vipRate.toFixed(2)}/hr)</option>
                  <option value={PCGroup.STANDARD}>Standard Zone (${settings.standardRate.toFixed(2)}/hr)</option>
                  <option value={PCGroup.CONSOLE}>Console Lounge (${settings.consoleRate.toFixed(2)}/hr)</option>
                  <option value={PCGroup.STREAMING}>Streaming Booth (${settings.streamingRate.toFixed(2)}/hr)</option>
                </select>
              </div>

              {/* Select Membership Tier */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Member Loyalty Level</label>
                <select
                  value={calcTier}
                  onChange={(e) => setCalcTier(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 cursor-pointer"
                >
                  <option value="None">Guest / Non-member (0% Discount)</option>
                  <option value="Silver">Silver Level (5% Discount)</option>
                  <option value="Gold">Gold Level (10% Discount)</option>
                  <option value="Platinum">Platinum Level (15% Discount)</option>
                </select>
              </div>

              {/* Input Duration Hours */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Booked Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={calcHours}
                  onChange={(e) => setCalcHours(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50"
                />
              </div>

              {/* Tax Toggle */}
              <div className="flex items-center space-x-2 pt-6">
                <button
                  type="button"
                  onClick={() => setCalcTax(!calcTax)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-150 focus:outline-none ${
                    calcTax ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-150 ${
                    calcTax ? "translate-x-4" : "translate-x-0"
                  }`} />
                </button>
                <span className="text-xs text-slate-600 font-medium">Apply local tax ({settings.taxRate}%)</span>
              </div>

            </div>
          </div>

          {/* Receipt Output Box */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden">
            {/* Decors */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400 font-bold uppercase tracking-widest border-b border-slate-800 pb-3">
                <Plus className="w-4 h-4 animate-spin" />
                <span>Estimated Receipt</span>
              </div>

              {/* Breakdown detail rows */}
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Base Hourly Rate:</span>
                  <span className="text-slate-200">${hourlyRate.toFixed(2)}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Hours booked:</span>
                  <span className="text-slate-200">{calcHours} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Base Subtotal:</span>
                  <span className="text-slate-200">${rawSubtotal.toFixed(2)}</span>
                </div>

                {discountRate > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>{calcTier} discount ({discountRate * 100}%):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-800 pt-2.5">
                  <span className="text-slate-400">Taxed Subtotal:</span>
                  <span className="text-slate-200">${subtotalAfterDiscount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Local Tax ({calcTax ? `${settings.taxRate}%` : "0%"}):</span>
                  <span className="text-slate-200">${taxAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Total Block */}
            <div className="mt-8 pt-4 border-t border-dashed border-slate-800 space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-400 font-mono uppercase">Grand Total Due:</span>
                <span className="text-3xl font-bold font-mono text-white tracking-tight">${finalTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => alert(`Calculator Estimate: Total is $${finalTotal.toFixed(2)}. Apply this during Quick Session checkout!`)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold font-sans transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-500/20"
              >
                <DollarSign className="w-4 h-4" />
                <span>Confirm Quote</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
}
