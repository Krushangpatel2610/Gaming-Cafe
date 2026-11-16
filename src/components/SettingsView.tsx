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
  Trash2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Layers
} from "lucide-react";
import { SystemSettings } from "../types";
import { useAuth } from "../context/AuthContext";
import { ApiError, buildUrl } from "../api/client";
import {
  getPaymentQr,
  updatePaymentQr,
  getBookingConfig,
  updateBookingConfig,
  getKioskSettings,
  updateKioskSettings,
  getLoginBackgroundSettings,
  updateLoginBackgroundSettings,
  uploadLoginMedia,
  ApiKioskSettings
} from "../api/stores";
import {
  getLoyaltySettings,
  updateLoyaltySettings,
  listLoyaltyRewardsAdmin,
  createLoyaltyReward,
  updateLoyaltyReward,
  deleteLoyaltyReward,
} from "../api/loyalty";
import { getPayLaterData, updatePaymentSettings } from "../api/customers";
import {
  ApiBookingConfig,
  ApiPaymentQr,
  ApiLoyaltySettings,
  ApiLoyaltyReward,
  ApiLoginBackgroundMediaItem,
} from "../api/types";

interface SettingsViewProps {
  settings: SystemSettings;
  systemTypes: import("../api/types").ApiSystemType[];
  onSaveSettings: (settings: SystemSettings, rateChanges: { systemTypeId: string; hourlyBaseRate: number }[]) => void;
}

type SettingsSection = "all" | "general" | "rates" | "payments" | "booking" | "kiosk" | "loyalty" | "media";

export default function SettingsView({ settings, systemTypes, onSaveSettings }: SettingsViewProps) {
  const { storeId, admin } = useAuth();
  const isSuperAdmin = admin?.role === "super_admin";
  const [activeSection, setActiveSection] = useState<SettingsSection>("all");

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

  // ── Pay Later Policy & Limits ─────────────────────────────
  const [payLaterMaxDaily, setPayLaterMaxDaily] = useState<number>(1);
  const [payLaterMaxPerReq, setPayLaterMaxPerReq] = useState<number>(1000);
  const [payLaterMaxDebt, setPayLaterMaxDebt] = useState<number>(5000);
  const [payLaterRepaymentDays, setPayLaterRepaymentDays] = useState<number>(7);
  const [savingPayLaterSettings, setSavingPayLaterSettings] = useState<boolean>(false);
  const [payLaterSettingsSaved, setPayLaterSettingsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (!storeId) return;
    getPayLaterData(storeId)
      .then((res: any) => {
        const s = res?.settings || res?.limits;
        if (s) {
          setPayLaterMaxDaily(s.maxRequestsPerDay ?? 1);
          setPayLaterMaxPerReq(s.maxAmountPerRequest ?? 1000);
          setPayLaterMaxDebt(s.maxOutstandingBalance ?? 5000);
          setPayLaterRepaymentDays(s.repaymentWindowDays ?? 7);
        }
      })
      .catch(() => {});
  }, [storeId]);

  const handleSavePayLaterSettings = async () => {
    if (!storeId) return;
    setSavingPayLaterSettings(true);
    setPayLaterSettingsSaved(false);
    try {
      await updatePaymentSettings(storeId, {
        pay_later_max_requests_per_day: Number(payLaterMaxDaily),
        pay_later_max_amount_per_request: Number(payLaterMaxPerReq),
        pay_later_max_outstanding_balance: Number(payLaterMaxDebt),
        pay_later_repayment_window_days: Number(payLaterRepaymentDays),
      });
      setPayLaterSettingsSaved(true);
      setTimeout(() => setPayLaterSettingsSaved(false), 3000);
    } catch (err: any) {
      window.alert(`Failed to save Pay Later policy: ${err?.message || "unknown error"}`);
    } finally {
      setSavingPayLaterSettings(false);
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

  // ── Kiosk Sign-in Background Media (super_admin / admin editable) ─────────
  const [bgMediaList, setBgMediaList] = useState<ApiLoginBackgroundMediaItem[]>([]);
  const [bgChangeInterval, setBgChangeInterval] = useState<number>(15);
  const [uploadingMedia, setUploadingMedia] = useState<boolean>(false);
  const [savingBgMedia, setSavingBgMedia] = useState<boolean>(false);
  const [bgMediaSaved, setBgMediaSaved] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>("");
  const [urlName, setUrlName] = useState<string>("");
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    getLoginBackgroundSettings(storeId)
      .then((res) => {
        setBgMediaList(res.media || []);
        setBgChangeInterval(res.changeIntervalSeconds || 15);
      })
      .catch(() => {});
  }, [storeId]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storeId) return;
    setUploadingMedia(true);
    setMediaError(null);

    try {
      const newItems: ApiLoginBackgroundMediaItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const item = await uploadLoginMedia(storeId, files[i]);
        newItems.push(item);
      }
      setBgMediaList((prev) => [...prev, ...newItems]);
    } catch (err) {
      setMediaError(err instanceof ApiError ? err.message : "Failed to upload file(s).");
    } finally {
      setUploadingMedia(false);
      e.target.value = "";
    }
  };

  const handleAddMediaUrl = () => {
    if (!urlInput.trim()) return;
    const newItem: ApiLoginBackgroundMediaItem = {
      id: crypto.randomUUID(),
      type: "image",
      url: urlInput.trim(),
      name: urlName.trim() || "Photo Backdrop",
    };
    setBgMediaList((prev) => [...prev, newItem]);
    setUrlInput("");
    setUrlName("");
  };

  const handleRemoveMedia = (id: string) => {
    setBgMediaList((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMoveMedia = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= bgMediaList.length) return;
    const updated = [...bgMediaList];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setBgMediaList(updated);
  };

  const handleSaveBgMedia = async () => {
    if (!storeId) return;
    setSavingBgMedia(true);
    setMediaError(null);
    try {
      const updated = await updateLoginBackgroundSettings(storeId, {
        media: bgMediaList,
        changeIntervalSeconds: bgChangeInterval,
      });
      setBgMediaList(updated.media || []);
      setBgChangeInterval(updated.changeIntervalSeconds || 15);
      setBgMediaSaved(true);
      setTimeout(() => setBgMediaSaved(false), 3000);
    } catch (err) {
      setMediaError(err instanceof ApiError ? err.message : "Failed to save media settings.");
    } finally {
      setSavingBgMedia(false);
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
  const [taxRate, setTaxRate] = useState<number>(settings.taxRate);
  const [openingTime, setOpeningTime] = useState<string>(settings.openingTime);
  const [closingTime, setClosingTime] = useState<string>(settings.closingTime);
  const [allowGuests, setAllowGuests] = useState<boolean>(settings.allowGuests);
  const [autoLockScreen, setAutoLockScreen] = useState<boolean>(settings.autoLockScreen);

  // Real per-System-Type hourly rates
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

  const tabs = [
    { id: "all", label: "All Settings", icon: Layers },
    { id: "general", label: "Profile & Hours", icon: Building },
    { id: "rates", label: "Hourly Rates", icon: DollarSign },
    { id: "payments", label: "Payments & QR", icon: QrCode },
    { id: "booking", label: "Booking Rules", icon: CalendarClock },
    { id: "kiosk", label: "Kiosk Agent", icon: Monitor },
    { id: "loyalty", label: "Loyalty Program", icon: Sparkles },
    { id: "media", label: "Sign-In Media", icon: ImageIcon },
  ];

  const showGeneral = activeSection === "all" || activeSection === "general" || activeSection === "rates";
  const showPayments = activeSection === "all" || activeSection === "payments";
  const showBooking = activeSection === "all" || activeSection === "booking";
  const showKiosk = activeSection === "all" || activeSection === "kiosk";
  const showLoyalty = activeSection === "all" || activeSection === "loyalty";
  const showMedia = activeSection === "all" || activeSection === "media";

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
          <h2 className="text-xl font-bold text-slate-900 font-display">System Settings &amp; Configurations</h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure lounge branding, hourly system rates, UPI payments, booking windows, kiosk enforcement, and loyalty program.
          </p>
        </div>

        {showSavedNotification && (
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as SettingsSection)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* General & Rates Form */}
      {showGeneral && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 columns: General profile, hours, security */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* General Lounge Profile */}
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => onSaveSettings({ ...settings, currency: e.target.value }, [])}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-sans transition-all"
                  >
                    <option value="INR">₹ Indian Rupee (INR)</option>
                    <option value="USD">$ US Dollar (USD)</option>
                    <option value="EUR">€ Euro (EUR)</option>
                    <option value="GBP">£ British Pound (GBP)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">Real — saves to the store record.</p>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision space-y-4">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
                <Clock className="w-4.5 h-4.5 text-indigo-600" />
                <span>Operating Hours</span>
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

            {/* Safety & Policies */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision space-y-5">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
                <Shield className="w-4.5 h-4.5 text-indigo-600" />
                <span>Security &amp; Terminal Policies</span>
              </div>

              <div className="space-y-4">
                {/* Allow guests toggle */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700">Allow Guest Sessions</h4>
                    <p className="text-[11px] text-slate-400">Permit login on terminals without verifying member accounts.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowGuests(!allowGuests)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-150 focus:outline-none shrink-0 ${
                      allowGuests ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-150 ${
                      allowGuests ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Autolock screen toggle */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700">Auto Lock Terminals</h4>
                    <p className="text-[11px] text-slate-400">Lock screens automatically when play timers expire.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoLockScreen(!autoLockScreen)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-150 focus:outline-none shrink-0 ${
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
          <div className="space-y-6 min-w-0">
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
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Settings &amp; Rates</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Payment QR & Booking Configuration: Responsive 2-column grid */}
      {(showPayments || showBooking) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* UPI Payment QR & Pay Later Policy */}
          {showPayments && (
            <>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision space-y-4 min-w-0">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
                <QrCode className="w-4.5 h-4.5 text-indigo-600" />
                <span>UPI Payment QR</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Upload your own UPI QR (PhonePe, GPay, Paytm). Customers scan and pay directly, and staff confirm the payment from the Payments tab.
              </p>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-28 h-28 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {qrPreview || qr?.upiQrImage ? (
                    <img src={qrPreview || qr?.upiQrImage || ""} alt="UPI QR" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 w-full space-y-2.5 min-w-0">
                  {isSuperAdmin && (
                    <label className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 rounded-lg text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload QR Image</span>
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleQrFileChange} className="hidden" />
                    </label>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Store UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      disabled={!isSuperAdmin}
                      placeholder="yourstore@upi"
                      className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={handleSaveQr}
                  disabled={savingQr || (!qrPreview && upiId === (qr?.upiId || ""))}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  {savingQr ? "Saving…" : "Save Payment QR"}
                </button>
              )}
            </div>

            {/* Pay Later Policy & Limits Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision space-y-4 min-w-0">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
                <Clock className="w-4.5 h-4.5 text-indigo-600" />
                <span>Pay Later Policy &amp; Restrictions</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Configure limits for the Pay Later feature. Gamers who breach cumulative limits or overdue windows will be locked out and required to settle at the counter.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Max Requests Per Day (Per Gamer)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={payLaterMaxDaily}
                    onChange={(e) => setPayLaterMaxDaily(parseInt(e.target.value) || 1)}
                    disabled={!isSuperAdmin}
                    className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  />
                  <p className="text-[10px] text-slate-400">e.g. 1 request per day</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Max Amount Per Request (₹)
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={50}
                    value={payLaterMaxPerReq}
                    onChange={(e) => setPayLaterMaxPerReq(parseFloat(e.target.value) || 1000)}
                    disabled={!isSuperAdmin}
                    className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  />
                  <p className="text-[10px] text-slate-400">Single request cap</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Max Cumulative Unpaid Balance (₹)
                  </label>
                  <input
                    type="number"
                    min={50}
                    step={100}
                    value={payLaterMaxDebt}
                    onChange={(e) => setPayLaterMaxDebt(parseFloat(e.target.value) || 5000)}
                    disabled={!isSuperAdmin}
                    className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  />
                  <p className="text-[10px] text-slate-400">Hard debt limit before lockout</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Repayment Window (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={payLaterRepaymentDays}
                    onChange={(e) => setPayLaterRepaymentDays(parseInt(e.target.value) || 7)}
                    disabled={!isSuperAdmin}
                    className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  />
                  <p className="text-[10px] text-slate-400">Days until debt marked overdue</p>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="flex items-center justify-between pt-2">
                  {payLaterSettingsSaved ? (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Settings saved!
                    </span>
                  ) : <span />}
                  <button
                    type="button"
                    onClick={handleSavePayLaterSettings}
                    disabled={savingPayLaterSettings}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    {savingPayLaterSettings ? "Saving…" : "Save Pay Later Policy"}
                  </button>
                </div>
              )}
            </div>
            </>
          )}

          {/* Booking Configuration */}
          {showBooking && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-precision space-y-4 min-w-0">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
                <CalendarClock className="w-4.5 h-4.5 text-indigo-600" />
                <span>Booking Configuration</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Set reservation lead times, payment hold windows, and check-in grace periods enforced for bookings.
              </p>

              {bookingConfig ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <p className="text-xs text-slate-400">Loading booking configuration…</p>
              )}

              {isSuperAdmin && bookingConfig && (
                <button
                  type="button"
                  onClick={handleSaveBookingConfig}
                  disabled={savingConfig}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  {savingConfig ? "Saving…" : "Save Booking Config"}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Kiosk Agent Settings: Dedicated Full-Width Container */}
      {showKiosk && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-precision min-w-0">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
            <Monitor className="w-4.5 h-4.5 text-indigo-600" />
            <span>Kiosk Agent Settings &amp; Process Allowlist</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The background agent installed on each physical gaming PC enforces these policies. Only listed applications are permitted to run — unauthorized processes are terminated automatically.
          </p>

          {kioskSettings ? (
            <div className="space-y-5">
              {/* Warning minutes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Low-credit warning (minutes before expiry)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={kioskSettings.warningMinutes}
                    onChange={(e) => setKioskSettings({ ...kioskSettings, warningMinutes: parseInt(e.target.value) || 5 })}
                    disabled={!isSuperAdmin}
                    className="w-28 px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono disabled:opacity-50"
                  />
                  <span className="text-xs text-slate-500">minutes before timer ends</span>
                </div>
              </div>

              {/* App whitelist */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Allowed executable processes</label>
                {kioskSettings.allowedApps.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>No processes listed — allowlist enforcement is disabled. Add process names (e.g. valorant.exe, steam.exe) to enable.</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {kioskSettings.allowedApps.map((app) => (
                      <span key={app} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-mono px-2.5 py-1 rounded-lg">
                        <span>{app}</span>
                        {isSuperAdmin && (
                          <button type="button" onClick={() => handleRemoveApp(app)} className="text-indigo-400 hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {isSuperAdmin && (
                  <div className="flex gap-2 max-w-md pt-1">
                    <input
                      value={newApp}
                      onChange={(e) => setNewApp(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddApp())}
                      placeholder="e.g. cs2.exe, valorant.exe"
                      className="flex-1 px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddApp}
                      disabled={!newApp.trim()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                )}
              </div>

              {isSuperAdmin && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveKiosk}
                    disabled={savingKiosk}
                    className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    {kioskSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{savingKiosk ? "Saving…" : kioskSaved ? "Settings Saved & Pushed!" : "Save & Push to Online Agents"}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Loading kiosk agent settings…</p>
          )}
        </div>
      )}

      {/* Loyalty Points: Dedicated Full-Width Container */}
      {showLoyalty && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-precision min-w-0">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3 font-display">
            <Sparkles className="w-4.5 h-4.5 text-amber-500" />
            <span>Loyalty &amp; Rewards Program</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Players earn loyalty points automatically as they play. Points can be redeemed for free playtime, beverage vouchers, or custom rewards in the customer app.
          </p>

          {loyaltySettings ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Points earned per hour played</label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  disabled={isStaff}
                  value={pointsPerHour}
                  onChange={(e) => setPointsPerHour(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50"
                />
              </div>
              <div className="flex items-center justify-between sm:justify-start sm:gap-3 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Program Active</span>
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
                  className="py-2 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {loyaltySaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{savingLoyalty ? "Saving…" : loyaltySaved ? "Rules Saved!" : "Save Loyalty Rules"}</span>
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Loading loyalty settings…</p>
          )}

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Catalog of Redeemable Rewards</label>
              <span className="text-[10px] font-mono text-slate-400">{rewards.length} active reward{rewards.length === 1 ? "" : "s"}</span>
            </div>

            {rewards.length === 0 ? (
              <p className="text-xs text-slate-400">No rewards created yet — create one below.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rewards.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm">
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${r.isActive ? "text-slate-800" : "text-slate-400 line-through"}`}>{r.name}</p>
                      <p className="text-[11px] text-indigo-600 font-mono font-semibold mt-0.5">
                        {r.pointsCost} pts{r.stock !== null ? ` · ${r.stock} left` : " · Unlimited"}
                      </p>
                    </div>
                    {!isStaff && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleReward(r)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${r.isActive ? "text-amber-700 bg-amber-50" : "text-slate-500 bg-slate-200"}`}
                        >
                          {r.isActive ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReward(r)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
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
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 pt-2">
                <input
                  value={newRewardName}
                  onChange={(e) => setNewRewardName(e.target.value)}
                  placeholder="Reward title (e.g. 1 Hour Free Play, Energy Drink)"
                  className="px-3 py-2 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <input
                  type="number"
                  min={1}
                  value={newRewardCost}
                  onChange={(e) => setNewRewardCost(parseInt(e.target.value, 10) || 0)}
                  placeholder="Points cost"
                  className="w-28 px-3 py-2 border border-slate-200 text-xs rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <input
                  value={newRewardStock}
                  onChange={(e) => setNewRewardStock(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Stock (blank = ∞)"
                  className="w-32 px-3 py-2 border border-slate-200 text-xs rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={handleAddReward}
                  disabled={savingReward || !newRewardName.trim() || newRewardCost <= 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Reward</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kiosk Sign-In Screen Background Photos & Slideshow: Dedicated Full-Width Container */}
      {showMedia && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-precision min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base font-display">
                  Kiosk Sign-in Background Photos &amp; Slideshow
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload photos displayed as high-resolution slideshows on physical gaming PC login screens.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {bgMediaSaved && (
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Photos Saved!</span>
                </div>
              )}
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={handleSaveBgMedia}
                  disabled={savingBgMedia}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingBgMedia ? "Saving…" : "Save Photo Settings"}</span>
                </button>
              )}
            </div>
          </div>

          {mediaError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{mediaError}</span>
            </div>
          )}

          {/* Time Interval & Upload controls */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50/70 p-5 rounded-xl border border-slate-100">
            {/* Interval Configuration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Slide Change Interval
                </label>
              </div>
              <p className="text-[11px] text-slate-500">
                How often does the background change to the next photo on the kiosk sign-in screen?
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={3}
                  max={3600}
                  disabled={!isSuperAdmin}
                  value={bgChangeInterval}
                  onChange={(e) => setBgChangeInterval(Math.max(3, parseInt(e.target.value) || 15))}
                  className="w-24 px-3 py-2 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <span className="text-xs font-semibold text-slate-500">seconds per slide</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                {[5, 10, 15, 30, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    disabled={!isSuperAdmin}
                    onClick={() => setBgChangeInterval(sec)}
                    className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
                      bgChangeInterval === sec
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Files */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Upload Photos</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Select one or multiple photos from your computer (PNG, JPG, WebP, GIF).
              </p>
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif,image/*"
                  disabled={!isSuperAdmin || uploadingMedia}
                  onChange={handleMediaUpload}
                  className="hidden"
                  id="login-media-upload-input"
                />
                <label
                  htmlFor="login-media-upload-input"
                  className={`w-full h-24 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                    uploadingMedia || !isSuperAdmin ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <Upload className="w-5 h-5 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-700">
                    {uploadingMedia ? "Uploading photos…" : "Choose Photos"}
                  </span>
                  <span className="text-[10px] text-slate-400">Multiple photos supported</span>
                </label>
              </div>
            </div>

            {/* Add by URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Add Photo by URL (Direct Link)</span>
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={urlName}
                  onChange={(e) => setUrlName(e.target.value)}
                  disabled={!isSuperAdmin}
                  placeholder="Label / Title (e.g. Esports Arena)"
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMediaUrl()}
                    disabled={!isSuperAdmin}
                    placeholder="https://example.com/wallpaper.jpg"
                    className="flex-1 px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddMediaUrl}
                    disabled={!isSuperAdmin || !urlInput.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Media Playlist Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
                <span>Slideshow Photos ({bgMediaList.length} photo{bgMediaList.length === 1 ? "" : "s"})</span>
              </label>
              {bgMediaList.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  Total cycle duration: {bgMediaList.length * bgChangeInterval} seconds
                </span>
              )}
            </div>

            {bgMediaList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No background photos added yet</p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  When no photos are uploaded, the kiosk sign-in screen uses the default cyber arena theme. Upload arena photos or promotional graphics to showcase on your gaming stations.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {bgMediaList.map((item, index) => {
                  const resolvedUrl = buildUrl(item.url);
                  return (
                    <div
                      key={item.id}
                      className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                    >
                      {/* Photo Preview Box */}
                      <div className="relative w-full h-36 bg-slate-900 flex items-center justify-center overflow-hidden">
                        <img
                          src={resolvedUrl}
                          alt={item.name || "Background"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-950/80 backdrop-blur-md text-emerald-300 font-mono text-[10px] font-bold tracking-wider flex items-center gap-1 border border-emerald-700/50">
                          <ImageIcon className="w-3 h-3 text-emerald-400" />
                          <span>PHOTO</span>
                        </div>
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[10px]">
                          #{index + 1}
                        </span>
                      </div>

                      {/* Info & Action Footer */}
                      <div className="p-3 flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate" title={item.name || item.url}>
                            {item.name || `Slide #${index + 1}`}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate" title={item.url}>
                            {item.url}
                          </p>
                        </div>

                        {isSuperAdmin && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveMedia(index, -1)}
                              disabled={index === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
                              title="Move earlier"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveMedia(index, 1)}
                              disabled={index === bgMediaList.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
                              title="Move later"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(item.id)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                              title="Remove media"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
