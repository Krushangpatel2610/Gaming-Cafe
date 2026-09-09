import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Save,
  DollarSign,
  Shield,
  Clock,
  Building,
  CheckCircle2,
  QrCode,
  Upload,
  CalendarClock,
  Monitor,
  Plus,
  X,
  AlertCircle,
  Sparkles,
  Trash2
} from "lucide-react";
import { SystemSettings } from "../types";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { getPaymentQr, updatePaymentQr, getBookingConfig, updateBookingConfig, getKioskSettings, updateKioskSettings, ApiKioskSettings } from "../api/stores";
import {
  getLoyaltySettings,
  updateLoyaltySettings,
  listLoyaltyRewardsAdmin,
  createLoyaltyReward,
  updateLoyaltyReward,
  deleteLoyaltyReward,
} from "../api/loyalty";
import { ApiBookingConfig, ApiPaymentQr, ApiLoyaltySettings, ApiLoyaltyReward } from "../api/types";

interface SettingsViewProps {
  settings: SystemSettings;
  systemTypes: import("../api/types").ApiSystemType[];
  onSaveSettings: (settings: SystemSettings, rateChanges: { systemTypeId: string; hourlyBaseRate: number }[]) => void;
}

export default function SettingsView({ settings, systemTypes, onSaveSettings }: SettingsViewProps) {
  const { storeId, admin } = useAuth();
  const isSuperAdmin = admin?.role === "super_admin";

  // ── Payment QR (real, super_admin editable) ─────────────────────────────
  const [qr, setQr] = useState<ApiPaymentQr | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [upiId, setUpiId] = useState<string>("");
  const [savingQr, setSavingQr] = useState<boolean>(false);

  useEffect(() => {
    if (!storeId) return;
    getPaymentQr(storeId)
      .then((res) => {
        setQr(res);
        setUpiId(res.upiId || "");
      })
      .catch(() => {});
  }, [storeId]);

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setQrPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveQr = async () => {
    if (!storeId) return;
    setSavingQr(true);
    try {
      const updated = await updatePaymentQr(storeId, {
        upiQrImage: qrPreview || undefined,
        upiId: upiId || undefined
      });
      setQr(updated);
      setQrPreview(null);
    } catch (err) {
      window.alert(`Failed to save payment QR: ${err instanceof ApiError ? err.message : "unknown error"}`);
    } finally {
      setSavingQr(false);
    }
  };

  // ── Kiosk agent settings ─────────────────────────────────────────────────
  const [kioskSettings, setKioskSettings] = useState<ApiKioskSettings | null>(null);
  const [newApp, setNewApp] = useState<string>("");
  const [savingKiosk, setSavingKiosk] = useState<boolean>(false);
  const [kioskSaved, setKioskSaved] = useState<boolean>(false);

  useEffect(() => {
    if (!storeId) return;
    getKioskSettings(storeId).then(setKioskSettings).catch(() => {});
  }, [storeId]);

  const handleAddApp = () => {
    const name = newApp.toLowerCase().trim();
    if (!name || !kioskSettings) return;
    if (!kioskSettings.allowedApps.includes(name)) {
      setKioskSettings({ ...kioskSettings, allowedApps: [...kioskSettings.allowedApps, name] });
    }
    setNewApp("");
  };

  const handleRemoveApp = (app: string) => {
    if (!kioskSettings) return;
    setKioskSettings({ ...kioskSettings, allowedApps: kioskSettings.allowedApps.filter((a) => a !== app) });
  };

  const handleSaveKiosk = async () => {
    if (!storeId || !kioskSettings) return;
    setSavingKiosk(true);
    try {
      const updated = await updateKioskSettings(storeId, kioskSettings);
      setKioskSettings(updated);
      setKioskSaved(true);
      setTimeout(() => setKioskSaved(false), 3000);
    } catch (err) {
      window.alert(`Failed to save kiosk settings: ${err instanceof ApiError ? err.message : "unknown error"}`);
    } finally {
      setSavingKiosk(false);
    }
  };

  // ── Loyalty points (real, admin/super_admin editable) ────────────────────
  const [loyaltySettings, setLoyaltySettings] = useState<ApiLoyaltySettings | null>(null);
  const [pointsPerHour, setPointsPerHour] = useState<number>(0);
  const [loyaltyActive, setLoyaltyActive] = useState<boolean>(true);
  const [savingLoyalty, setSavingLoyalty] = useState<boolean>(false);
  const [loyaltySaved, setLoyaltySaved] = useState<boolean>(false);
  const isStaff = admin?.role === "staff";

  const [rewards, setRewards] = useState<ApiLoyaltyReward[]>([]);
  const [newRewardName, setNewRewardName] = useState("");
  const [newRewardCost, setNewRewardCost] = useState<number>(100);
  const [newRewardStock, setNewRewardStock] = useState<string>("");
  const [savingReward, setSavingReward] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    getLoyaltySettings(storeId)
      .then((s) => {
        setLoyaltySettings(s);
        setPointsPerHour(parseFloat(s.pointsPerHour));
        setLoyaltyActive(s.isActive);
      })
      .catch(() => {});
    listLoyaltyRewardsAdmin(storeId).then(setRewards).catch(() => {});
  }, [storeId]);

  const handleSaveLoyalty = async () => {
    if (!storeId) return;
    setSavingLoyalty(true);
    try {
      const updated = await updateLoyaltySettings(storeId, { pointsPerHour, isActive: loyaltyActive });
      setLoyaltySettings(updated);
      setLoyaltySaved(true);
      setTimeout(() => setLoyaltySaved(false), 3000);
    } catch (err) {
      window.alert(`Failed to save loyalty settings: ${err instanceof ApiError ? err.message : "unknown error"}`);
    } finally {
      setSavingLoyalty(false);
    }
  };

  const handleAddReward = async () => {
    if (!storeId || !newRewardName.trim() || newRewardCost <= 0) return;
    setSavingReward(true);
    try {
      const created = await createLoyaltyReward(storeId, {
        name: newRewardName.trim(),
        pointsCost: newRewardCost,
        stock: newRewardStock.trim() ? parseInt(newRewardStock, 10) : undefined,
      });
      setRewards((prev) => [...prev, created]);
      setNewRewardName("");
      setNewRewardCost(100);
      setNewRewardStock("");
    } catch (err) {
      window.alert(`Failed to create reward: ${err instanceof ApiError ? err.message : "unknown error"}`);
    } finally {
      setSavingReward(false);
    }
  };

  const handleToggleReward = async (reward: ApiLoyaltyReward) => {
    if (!storeId) return;
    try {
      const updated = await updateLoyaltyReward(storeId, reward.id, { isActive: !reward.isActive });
      setRewards((prev) => prev.map((r) => (r.id === reward.id ? updated : r)));
    } catch (err) {
      window.alert(`Failed to update reward: ${err instanceof ApiError ? err.message : "unknown error"}`);
    }
  };

  const handleDeleteReward = async (reward: ApiLoyaltyReward) => {
    if (!storeId) return;
    if (!window.confirm(`Delete reward "${reward.name}"?`)) return;
    try {
      await deleteLoyaltyReward(storeId, reward.id);
      setRewards((prev) => prev.filter((r) => r.id !== reward.id));
    } catch (err) {
      window.alert(`Failed to delete reward: ${err instanceof ApiError ? err.message : "unknown error"}`);
    }
  };

  // ── Booking configuration (real, super_admin editable) ──────────────────
  const [bookingConfig, setBookingConfig] = useState<ApiBookingConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  useEffect(() => {
    if (!storeId) return;
    getBookingConfig(storeId)
      .then(setBookingConfig)
      .catch(() => {});
  }, [storeId]);

  const handleSaveBookingConfig = async () => {
    if (!storeId || !bookingConfig) return;
    setSavingConfig(true);
    try {
      setBookingConfig(await updateBookingConfig(storeId, bookingConfig));
    } catch (err) {
      window.alert(`Failed to save booking config: ${err instanceof ApiError ? err.message : "unknown error"}`);
    } finally {
      setSavingConfig(false);
    }
  };

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

      {/* Payment QR & Booking Configuration — real backend, independent save actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* UPI Payment QR */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
            <QrCode className="w-4.5 h-4.5 text-indigo-600" />
            <span>UPI Payment QR</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Upload your own UPI QR (PhonePe, GPay, etc). No payment gateway — customers scan and pay you directly, staff record it afterward from the Payments tab.
          </p>

          <div className="flex items-center gap-4">
            <div className="w-28 h-28 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
              {qrPreview || qr?.upiQrImage ? (
                <img src={qrPreview || qr?.upiQrImage || ""} alt="UPI QR" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              {isSuperAdmin && (
                <label className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-[11px] font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload image</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleQrFileChange} className="hidden" />
                </label>
              )}
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                disabled={!isSuperAdmin}
                placeholder="yourstore@upi (optional)"
                className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleSaveQr}
              disabled={savingQr || (!qrPreview && upiId === (qr?.upiId || ""))}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold transition-all"
            >
              {savingQr ? "Saving…" : "Save Payment QR"}
            </button>
          )}
        </div>

        {/* Booking configuration */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
            <CalendarClock className="w-4.5 h-4.5 text-indigo-600" />
            <span>Booking Configuration</span>
          </div>
          {bookingConfig ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Booking window (min)</label>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  disabled={!isSuperAdmin}
                  value={bookingConfig.bookingWindowMinutes}
                  onChange={(e) => setBookingConfig({ ...bookingConfig, bookingWindowMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono focus:outline-none disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Payment window (min)</label>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  disabled={!isSuperAdmin}
                  value={bookingConfig.paymentWindowMinutes}
                  onChange={(e) => setBookingConfig({ ...bookingConfig, paymentWindowMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono focus:outline-none disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">No-show grace (min)</label>
                <input
                  type="number"
                  min={0}
                  max={1440}
                  disabled={!isSuperAdmin}
                  value={bookingConfig.noShowGraceMinutes}
                  onChange={(e) => setBookingConfig({ ...bookingConfig, noShowGraceMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono focus:outline-none disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Early check-in (min)</label>
                <input
                  type="number"
                  min={0}
                  max={1440}
                  disabled={!isSuperAdmin}
                  value={bookingConfig.checkInEarlyMinutes}
                  onChange={(e) => setBookingConfig({ ...bookingConfig, checkInEarlyMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Loading…</p>
          )}
          {isSuperAdmin && bookingConfig && (
            <button
              type="button"
              onClick={handleSaveBookingConfig}
              disabled={savingConfig}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold transition-all"
            >
              {savingConfig ? "Saving…" : "Save Booking Config"}
            </button>
          )}
        </div>

        {/* Kiosk Agent Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Monitor className="w-4.5 h-4.5 text-indigo-600" />
            <span>Kiosk Agent</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The agent app installed on each gaming PC enforces these settings. Only listed processes are allowed to run — everything else is closed automatically. Changes push live to all online agents.
          </p>

          {kioskSettings ? (
            <>
              {/* Warning minutes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low-credit warning (minutes before expiry)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={kioskSettings.warningMinutes}
                  onChange={(e) => setKioskSettings({ ...kioskSettings, warningMinutes: parseInt(e.target.value) || 5 })}
                  disabled={!isSuperAdmin}
                  className="w-28 px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono disabled:opacity-50"
                />
              </div>

              {/* App whitelist */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Allowed processes</label>
                {kioskSettings.allowedApps.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>No apps listed — enforcement is disabled. Add process names to enable.</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {kioskSettings.allowedApps.map((app) => (
                      <span key={app} className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-mono px-2 py-0.5 rounded-md">
                        {app}
                        {isSuperAdmin && (
                          <button type="button" onClick={() => handleRemoveApp(app)} className="text-indigo-400 hover:text-red-500 ml-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {isSuperAdmin && (
                  <div className="flex gap-2">
                    <input
                      value={newApp}
                      onChange={(e) => setNewApp(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddApp()}
                      placeholder="e.g. csgo.exe"
                      className="flex-1 px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddApp}
                      disabled={!newApp.trim()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={handleSaveKiosk}
                  disabled={savingKiosk}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  {kioskSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {savingKiosk ? "Saving…" : kioskSaved ? "Saved!" : "Save & Push to Agents"}
                </button>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400">Loading…</p>
          )}
        </div>

        {/* Loyalty Points */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Sparkles className="w-4.5 h-4.5 text-amber-500" />
            <span>Loyalty Points</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Players earn points automatically when a session ends, based on the rate below. Redeemable rewards show up on the player app.
          </p>

          {loyaltySettings ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points per hour played</label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  disabled={isStaff}
                  value={pointsPerHour}
                  onChange={(e) => setPointsPerHour(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50"
                />
              </div>
              <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enabled</span>
                <button
                  type="button"
                  disabled={isStaff}
                  onClick={() => setLoyaltyActive(!loyaltyActive)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-150 focus:outline-none disabled:opacity-50 ${
                    loyaltyActive ? "bg-amber-500" : "bg-slate-300"
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-150 ${
                    loyaltyActive ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
              {!isStaff && (
                <button
                  type="button"
                  onClick={handleSaveLoyalty}
                  disabled={savingLoyalty}
                  className="py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  {loyaltySaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {savingLoyalty ? "Saving…" : loyaltySaved ? "Saved!" : "Save Rules"}
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Loading…</p>
          )}

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Redeemable Rewards</label>

            {rewards.length === 0 ? (
              <p className="text-xs text-slate-400">No rewards yet — add one below.</p>
            ) : (
              <div className="space-y-2">
                {rewards.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${r.isActive ? "text-slate-700" : "text-slate-400 line-through"}`}>{r.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {r.pointsCost} pts{r.stock !== null ? ` · ${r.stock} in stock` : ""}
                      </p>
                    </div>
                    {!isStaff && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleReward(r)}
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          {r.isActive ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReward(r)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isStaff && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 pt-1">
                <input
                  value={newRewardName}
                  onChange={(e) => setNewRewardName(e.target.value)}
                  placeholder="Reward name, e.g. Free hour"
                  className="px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <input
                  type="number"
                  min={1}
                  value={newRewardCost}
                  onChange={(e) => setNewRewardCost(parseInt(e.target.value, 10) || 0)}
                  placeholder="Points"
                  className="w-24 px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <input
                  value={newRewardStock}
                  onChange={(e) => setNewRewardStock(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Stock (blank = ∞)"
                  className="w-32 px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={handleAddReward}
                  disabled={savingReward || !newRewardName.trim() || newRewardCost <= 0}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
