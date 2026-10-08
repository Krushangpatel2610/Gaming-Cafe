import React, { useState, useEffect } from "react";
import { Store, Clock, Shield, Check, Loader2, Info, Copy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getSessionSettings, updateSessionSettings } from "../api/stores";

export default function StoreSettingsView() {
  const { admin, storeId } = useAuth();
  const canEdit = admin?.role === "super_admin" || admin?.role === "admin";

  const [graceMinutes, setGraceMinutes] = useState<number>(5);
  const [upfrontMinutes, setUpfrontMinutes] = useState<number>(60);
  const [extensionBlockMinutes, setExtensionBlockMinutes] = useState<number>(30);
  const [maxChosenHours, setMaxChosenHours] = useState<number>(12);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idCopied, setIdCopied] = useState<boolean>(false);

  const handleCopyStoreId = async () => {
    if (!storeId) return;
    try {
      await navigator.clipboard.writeText(storeId);
    } catch {
      const el = document.createElement("textarea");
      el.value = storeId;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!storeId) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await getSessionSettings(storeId);
        if (mounted) {
          setGraceMinutes(data.graceMinutes ?? 5);
          setUpfrontMinutes(data.upfrontMinutes ?? 60);
          setExtensionBlockMinutes(data.extensionBlockMinutes ?? 30);
          setMaxChosenHours(data.maxChosenHours ?? 12);
        }
      } catch (err: any) {
        if (mounted) {
          setErrorMsg(err.message || "Failed to load store settings");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [storeId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !canEdit) return;

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const updated = await updateSessionSettings(storeId, {
        graceMinutes: Number(graceMinutes),
        upfrontMinutes: Number(upfrontMinutes),
        extensionBlockMinutes: Number(extensionBlockMinutes),
        maxChosenHours: Number(maxChosenHours),
      });
      setGraceMinutes(updated.graceMinutes);
      setUpfrontMinutes(updated.upfrontMinutes);
      setExtensionBlockMinutes(updated.extensionBlockMinutes);
      setMaxChosenHours(updated.maxChosenHours);
      setSuccessMsg("Session & Billing settings saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update session settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display flex items-center gap-2.5">
            <Store className="w-6 h-6 text-indigo-600" />
            Store Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure venue-wide session, grace period, and billing rules for your gaming arena.
          </p>
        </div>
      </div>

      {storeId && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Store ID</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 text-slate-800 select-all break-all">
              {storeId}
            </code>
            <button
              type="button"
              onClick={handleCopyStoreId}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
            >
              {idCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{idCopied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Enter this Store ID when installing GameCentral on a gaming PC.
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-xs">Loading store configuration...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section: Session & Grace Period */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Session &amp; Grace Period
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Controls the courtesy grace duration granted to players upon logging into a gaming PC.
              </p>
            </div>

            <div className="space-y-2 max-w-md">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Free grace period after login (minutes)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Math.max(0, Math.min(30, parseInt(e.target.value) || 0)))}
                  disabled={!canEdit || saving}
                  className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="text-xs text-slate-500 font-mono">minutes (0 – 30)</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Players can add time, buy a gamepass, or top up during this period. Billing starts after it ends.
              </p>
            </div>
          </div>

          {/* Section: Billing Rules */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                Billing Rules
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upfront commitment, minute-wise settlement, and extension block rules applied to PC sessions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Upfront Duration (U)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={30}
                    max={240}
                    step={15}
                    value={upfrontMinutes}
                    onChange={(e) => setUpfrontMinutes(Math.max(30, Math.min(240, parseInt(e.target.value) || 30)))}
                    disabled={!canEdit || saving}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="text-xs text-slate-500 font-mono shrink-0">min</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Charged upfront at courtesy grace end (default 60m / 1 hour). Non-refundable once grace ends.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Extension Block (B)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={120}
                    step={5}
                    value={extensionBlockMinutes}
                    onChange={(e) => setExtensionBlockMinutes(Math.max(10, Math.min(120, parseInt(e.target.value) || 10)))}
                    disabled={!canEdit || saving}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="text-xs text-slate-500 font-mono shrink-0">min</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Block size charged upfront for playtime past the initial commitment (default 30m / half hour).
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Max Chosen Duration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={maxChosenHours}
                    onChange={(e) => setMaxChosenHours(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
                    disabled={!canEdit || saving}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="text-xs text-slate-500 font-mono shrink-0">hours</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Maximum hours a player can select at login (default 12 hours).
                </p>
              </div>
            </div>

            {canEdit && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-2 disabled:opacity-50 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Read-only info card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-700">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">
                Venue Billing Policy
              </span>
            </div>
            <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <p>
                <strong>Initial 1st Hour:</strong> Charged upfront once the free grace period expires. Always at least 1 full hour, non-refundable.
              </p>
              <p>
                <strong>Rest of Chosen Time:</strong> Minutes between 1st hour and initial commitment are charged per minute at session logout.
              </p>
              <p>
                <strong>Credit Holds:</strong> When confirming time, necessary credits are reserved on hold. Settled and released at logout.
              </p>
              <p>
                <strong>Added Time (Extensions):</strong> Time beyond the initial commitment is charged upfront in {extensionBlockMinutes}-minute blocks.
              </p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
