import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Save,
  DollarSign,
  Shield,
  Clock,
  Building,
  CheckCircle2
} from "lucide-react";
import { SystemSettings } from "../types";
import { ApiSystemType } from "../api/types";

interface SettingsViewProps {
  settings: SystemSettings;
  systemTypes: ApiSystemType[];
  onSaveSettings: (settings: SystemSettings, rateChanges: { systemTypeId: string; hourlyBaseRate: number }[]) => void;
}

export default function SettingsView({ settings, systemTypes, onSaveSettings }: SettingsViewProps) {
  const [loungeName, setLoungeName] = useState<string>(settings.loungeName);
  const [currencySymbol, setCurrencySymbol] = useState<string>(settings.currencySymbol);
  const [taxRate, setTaxRate] = useState<number>(settings.taxRate);
  const [openingTime, setOpeningTime] = useState<string>(settings.openingTime);
  const [closingTime, setClosingTime] = useState<string>(settings.closingTime);
  const [allowGuests, setAllowGuests] = useState<boolean>(settings.allowGuests);
  const [autoLockScreen, setAutoLockScreen] = useState<boolean>(settings.autoLockScreen);

  // Real per-System-Type hourly rates — replaces the old 4 fixed fields.
  const [rates, setRates] = useState<Record<string, number>>({});

  useEffect(() => {
    setLoungeName(settings.loungeName);
  }, [settings.loungeName]);

  useEffect(() => {
    setRates(Object.fromEntries(systemTypes.map(t => [t.id, parseFloat(t.hourlyBaseRate)])));
  }, [systemTypes]);

  const [showSavedNotification, setShowSavedNotification] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rateChanges = systemTypes
      .filter(t => rates[t.id] !== undefined && rates[t.id] !== parseFloat(t.hourlyBaseRate))
      .map(t => ({ systemTypeId: t.id, hourlyBaseRate: rates[t.id] }));

    onSaveSettings(
      {
        loungeName,
        currency: settings.currency,
        currencySymbol,
        taxRate,
        openingTime,
        closingTime,
        allowGuests,
        autoLockScreen
      },
      rateChanges
    );

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
            Lounge name and hourly rates are real and save to the backend. Tax/hours/toggles below have no backend equivalent yet and stay local to this browser.
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Lounge / Store Name</label>
                <input
                  type="text"
                  required
                  value={loungeName}
                  onChange={(e) => setLoungeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-sans transition-all"
                />
                <p className="text-[10px] text-slate-400">Real — saves to the store record.</p>
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
              <span>Operating Hours (local only)</span>
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
              <span>Security & Access (local only)</span>
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

        {/* Right column: Real hourly rates per System Type */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
              <DollarSign className="w-4.5 h-4.5 text-indigo-600" />
              <span>Hourly Rates by System Type</span>
            </div>

            <div className="space-y-3">
              {systemTypes.length === 0 ? (
                <p className="text-xs text-slate-400">No system types configured for this store yet.</p>
              ) : (
                systemTypes.map(type => (
                  <div key={type.id} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">{type.name} (₹ / Hour)</label>
                    <input
                      type="number"
                      step="0.10"
                      value={rates[type.id] ?? 0}
                      onChange={(e) => setRates(prev => ({ ...prev, [type.id]: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-mono transition-all"
                    />
                  </div>
                ))
              )}

              <div className="space-y-1 border-t border-slate-100 pt-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Local Tax Rate (%) — local only</label>
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
              <span>Save Settings</span>
            </button>
          </div>
        </div>

      </form>
    </motion.div>
  );
}
