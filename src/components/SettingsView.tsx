import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Settings, 
  Save, 
  DollarSign, 
  Shield, 
  ToggleLeft, 
  ToggleRight, 
  Clock, 
  Building,
  CheckCircle2
} from "lucide-react";
import { SystemSettings } from "../types";

interface SettingsViewProps {
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
}

export default function SettingsView({ settings, onSaveSettings }: SettingsViewProps) {
  const [loungeName, setLoungeName] = useState<string>(settings.loungeName);
  const [currency, setCurrency] = useState<string>(settings.currency);
  const [currencySymbol, setCurrencySymbol] = useState<string>(settings.currencySymbol);
  const [taxRate, setTaxRate] = useState<number>(settings.taxRate);
  const [standardRate, setStandardRate] = useState<number>(settings.standardRate);
  const [vipRate, setVIPRate] = useState<number>(settings.vipRate);
  const [consoleRate, setConsoleRate] = useState<number>(settings.consoleRate);
  const [streamingRate, setStreamingRate] = useState<number>(settings.streamingRate);
  const [openingTime, setOpeningTime] = useState<string>(settings.openingTime);
  const [closingTime, setClosingTime] = useState<string>(settings.closingTime);
  const [allowGuests, setAllowGuests] = useState<boolean>(settings.allowGuests);
  const [autoLockScreen, setAutoLockScreen] = useState<boolean>(settings.autoLockScreen);

  const [showSavedNotification, setShowSavedNotification] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      loungeName,
      currency,
      currencySymbol,
      taxRate,
      standardRate,
      vipRate,
      consoleRate,
      streamingRate,
      openingTime,
      closingTime,
      allowGuests,
      autoLockScreen
    });

    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header and Save status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">System Settings & Configurations</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure hourly rates, taxes, open hours, and automatic locking policies.
          </p>
        </div>

        {showSavedNotification && (
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column: General & Hours */}
        <div className="md:col-span-2 space-y-6">
          {/* General settings card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
              <Building className="w-4.5 h-4.5 text-indigo-600" />
              <span>General Lounge Profile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Lounge Brand Name</label>
                <input
                  type="text"
                  required
                  value={loungeName}
                  onChange={(e) => setLoungeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-sans transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Currency Symbol</label>
                <input
                  type="text"
                  required
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-mono transition-all"
                />
              </div>
            </div>
          </div>

          {/* Business Hours Settings Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
              <Clock className="w-4.5 h-4.5 text-indigo-600" />
              <span>Operating Hours Configuration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Opening Time (24h format)</label>
                <input
                  type="time"
                  required
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-mono transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Closing Time (24h format)</label>
                <input
                  type="time"
                  required
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-mono transition-all"
                />
              </div>
            </div>
          </div>

          {/* Safety Policies toggle toggles */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision space-y-5">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
              <Shield className="w-4.5 h-4.5 text-indigo-600" />
              <span>Security & Access Mandates</span>
            </div>

            <div className="space-y-4">
              {/* Allow guests toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700">Allow Guest Sessions</h4>
                  <p className="text-[11px] text-slate-400">Permit login on terminals without verifying member accounts.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowGuests(!allowGuests)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-150 focus:outline-none ${
                    allowGuests ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-150 ${
                    allowGuests ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {/* Autolock screen toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700">Auto Lock Terminals</h4>
                  <p className="text-[11px] text-slate-400">Lock screens automatically when play timers expire.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoLockScreen(!autoLockScreen)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-150 focus:outline-none ${
                    autoLockScreen ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-150 ${
                    autoLockScreen ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Tariff Rate values */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
              <DollarSign className="w-4.5 h-4.5 text-indigo-600" />
              <span>Hourly Tariffs & Taxes</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Standard PC Rate ($ / Hour)</label>
                <input
                  type="number"
                  step="0.10"
                  value={standardRate}
                  onChange={(e) => setStandardRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-mono transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">VIP PC Rate ($ / Hour)</label>
                <input
                  type="number"
                  step="0.10"
                  value={vipRate}
                  onChange={(e) => setVIPRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-mono transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Console Deck Rate ($ / Hour)</label>
                <input
                  type="number"
                  step="0.10"
                  value={consoleRate}
                  onChange={(e) => setConsoleRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-mono transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Streaming Booth Rate ($ / Hour)</label>
                <input
                  type="number"
                  step="0.10"
                  value={streamingRate}
                  onChange={(e) => setStreamingRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-mono transition-all"
                />
              </div>

              <div className="space-y-1 border-t border-slate-100 pt-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Local Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-mono transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-500/10"
            >
              <Save className="w-4 h-4" />
              <span>Save System Config</span>
            </button>
          </div>
        </div>

      </form>
    </motion.div>
  );
}
