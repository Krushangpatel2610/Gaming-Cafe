import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gamepad2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Building2,
  User,
  Users,
  Monitor,
  MapPin,
  Search,
  Plus,
  X,
  ChevronDown,
  CheckCircle2,
  Phone
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { adminLogin } from "../api/auth";
import { createStore, listActiveStores } from "../api/stores";
import { createSystem } from "../api/systems";
import { createSystemType } from "../api/systemTypes";
import { signupAsCustomer } from "../api/customers";
import { setStoredToken, ApiError } from "../api/client";
import { ApiAdminLoginResponse, ApiStore, ApiSystemPlatform } from "../api/types";

type Phase =
  | "role"
  | "owner-1"
  | "owner-2"
  | "owner-3"
  | "customer-1"
  | "customer-2"
  | "customer-done";

interface DraftSystemType {
  name: string;
  hourlyBaseRate: string;
}

interface DraftPC {
  name: string;
  count: number;
  stationNumber: number;
  platform: ApiSystemPlatform;
  systemTypeIndex: number | null;
  ipAddress: string;
  macAddress: string;
  cpu: string;
  gpu: string;
  ram: string;
  monitor: string;
}

const PLATFORMS: ApiSystemPlatform[] = ["pc", "ps5", "ps4", "xbox", "vr", "other"];

const OWNER_STEP_INDEX: Record<string, number> = { "owner-1": 1, "owner-2": 2, "owner-3": 3 };
const CUSTOMER_STEP_INDEX: Record<string, number> = { "customer-1": 1, "customer-2": 2, "customer-done": 3 };

interface SignupViewProps {
  onSwitchToLogin: () => void;
}

export default function SignupView({ onSwitchToLogin }: SignupViewProps) {
  const { applySession } = useAuth();
  const [phase, setPhase] = useState<Phase>("role");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // ── Owner path state ─────────────────────────────────────────────────────
  const [zoneName, setZoneName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [country, setCountry] = useState<string>("IN");
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");
  const [currency, setCurrency] = useState<string>("INR");

  const [adminName, setAdminName] = useState<string>("");
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [systemTypesList, setSystemTypesList] = useState<DraftSystemType[]>([]);
  const [typeDraft, setTypeDraft] = useState<DraftSystemType>({ name: "", hourlyBaseRate: "" });

  const [pcs, setPcs] = useState<DraftPC[]>([]);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [draft, setDraft] = useState<DraftPC>({
    name: "",
    count: 1,
    stationNumber: 1,
    platform: "pc",
    systemTypeIndex: null,
    ipAddress: "",
    macAddress: "",
    cpu: "",
    gpu: "",
    ram: "",
    monitor: ""
  });

  const [ownerStoreId, setOwnerStoreId] = useState<string | null>(null);
  const [ownerLoginResult, setOwnerLoginResult] = useState<ApiAdminLoginResponse | null>(null);
  const [pcWarning, setPcWarning] = useState<string | null>(null);

  // ── Customer path state ──────────────────────────────────────────────────
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [storesLoading, setStoresLoading] = useState<boolean>(false);
  const [storeSearch, setStoreSearch] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<ApiStore | null>(null);

  const [custName, setCustName] = useState<string>("");
  const [custEmail, setCustEmail] = useState<string>("");
  const [custPhone, setCustPhone] = useState<string>("");
  const [custPassword, setCustPassword] = useState<string>("");
  const [custConfirmPassword, setCustConfirmPassword] = useState<string>("");
  const [showCustPassword, setShowCustPassword] = useState<boolean>(false);

  useEffect(() => {
    if (phase !== "customer-1" || stores.length > 0) return;
    setStoresLoading(true);
    listActiveStores({ limit: 100 })
      .then(({ data }) => setStores(data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load gaming zones."))
      .finally(() => setStoresLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const filteredStores = stores.filter((s) => {
    const haystack = `${s.name} ${s.city || ""} ${s.address || ""}`.toLowerCase();
    return haystack.includes(storeSearch.toLowerCase());
  });

  // ── Owner handlers ────────────────────────────────────────────────────────

  const handleOwnerStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!zoneName.trim()) {
      setError("Give your gaming zone a name first.");
      return;
    }
    setPhase("owner-2");
  };

  const handleOwnerStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (adminPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (adminPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const { store } = await createStore({
        name: zoneName,
        address: address || undefined,
        city: city || undefined,
        country: country || undefined,
        timezone: timezone || undefined,
        currency: currency || undefined,
        adminName,
        adminEmail,
        adminPassword
      });
      const result = await adminLogin(adminEmail, adminPassword);
      setStoredToken(result.accessToken);
      setOwnerStoreId(store.id);
      setOwnerLoginResult(result);
      setPhase("owner-3");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create your gaming zone. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSystemType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeDraft.name.trim() || !typeDraft.hourlyBaseRate) return;
    setSystemTypesList((prev) => [...prev, typeDraft]);
    setTypeDraft({ name: "", hourlyBaseRate: "" });
  };

  const handleRemoveSystemType = (index: number) => {
    setSystemTypesList((prev) => prev.filter((_, i) => i !== index));
    setPcs((prev) => prev.map((pc) => ({
      ...pc,
      systemTypeIndex: pc.systemTypeIndex === index ? null
        : pc.systemTypeIndex !== null && pc.systemTypeIndex > index ? pc.systemTypeIndex - 1
        : pc.systemTypeIndex
    })));
  };

  const handleAddPc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;

    const startStation = pcs.length + 1;
    const count = Math.max(1, draft.count);
    const newEntries: DraftPC[] = Array.from({ length: count }, (_, i) => ({
      ...draft,
      count: 1,
      name: count === 1
        ? draft.name.trim()
        : `${draft.name.trim()} ${String(i + 1).padStart(2, "0")}`,
      stationNumber: startStation + i,
    }));

    setPcs((prev) => [...prev, ...newEntries]);
    // pcs is stale here (batched update) — use pcs.length + count to get the
    // correct next station number after the batch lands.
    setDraft({
      name: "",
      count: 1,
      stationNumber: pcs.length + count + 1,
      platform: draft.platform,
      systemTypeIndex: draft.systemTypeIndex, // keep category selected
      ipAddress: "",
      macAddress: "",
      cpu: draft.cpu,
      gpu: draft.gpu,
      ram: draft.ram,
      monitor: draft.monitor,
    });
    setShowAdvanced(false);
  };

  const handleRemovePc = (index: number) => {
    setPcs((prev) => prev.filter((_, i) => i !== index));
  };

  const finishOwnerSetup = async () => {
    if (!ownerStoreId || !ownerLoginResult) return;
    setSubmitting(true);
    setPcWarning(null);

    // Create system types first; build a map from draft-index → real API id
    const createdTypeIds: (string | null)[] = await Promise.all(
      systemTypesList.map(async (st) => {
        try {
          const { systemType } = await createSystemType(ownerStoreId, {
            name: st.name,
            hourlyBaseRate: parseFloat(st.hourlyBaseRate),
          });
          return systemType.id;
        } catch {
          return null;
        }
      })
    );

    let failures = 0;
    for (const pc of pcs) {
      const specs: Record<string, string> = {};
      if (pc.cpu) specs.cpu = pc.cpu;
      if (pc.gpu) specs.gpu = pc.gpu;
      if (pc.ram) specs.ram = pc.ram;
      if (pc.monitor) specs.monitor = pc.monitor;
      const systemTypeId =
        pc.systemTypeIndex !== null ? (createdTypeIds[pc.systemTypeIndex] ?? undefined) : undefined;
      try {
        await createSystem(ownerStoreId, {
          name: pc.name,
          stationNumber: pc.stationNumber,
          platform: pc.platform,
          systemTypeId,
          ipAddress: pc.ipAddress || undefined,
          macAddress: pc.macAddress || undefined,
          specs: Object.keys(specs).length > 0 ? specs : undefined,
        });
      } catch {
        failures += 1;
      }
    }
    if (failures > 0) {
      setPcWarning(`${failures} terminal${failures > 1 ? "s" : ""} couldn't be registered — you can add them from Live PCs after setup.`);
    }
    applySession(ownerLoginResult);
    setSubmitting(false);
  };

  // ── Customer handlers ─────────────────────────────────────────────────────

  const handleCustomerAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedStore) return;
    if (custPassword !== custConfirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (custPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      // One call: creates the login and links it to the chosen store's
      // customer directory. This app has no customer dashboard to hold a
      // session for, so there's no token to manage afterward.
      await signupAsCustomer(selectedStore.id, {
        name: custName,
        email: custEmail,
        password: custPassword,
        phone: custPhone || undefined
      });
      setPhase("customer-done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create your account. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setPhase("role");
    setError(null);
    setSelectedStore(null);
    setStoreSearch("");
    setCustName("");
    setCustEmail("");
    setCustPhone("");
    setCustPassword("");
    setCustConfirmPassword("");
  };

  const ownerStepNum = OWNER_STEP_INDEX[phase];
  const customerStepNum = CUSTOMER_STEP_INDEX[phase];

  return (
    <div className="min-h-screen bg-slate-950 overflow-y-auto relative">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950 pointer-events-none" />
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-lg"
      >
        <div className="bg-white rounded-2xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden max-h-[92vh] flex flex-col">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 shrink-0" />

          <div className="p-8 pb-5 flex flex-col items-center text-center shrink-0">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4"
            >
              <Gamepad2 className="w-7 h-7 text-white" />
            </motion.div>
            <h1 className="text-xl font-bold text-slate-900 font-display tracking-tight">
              {phase === "role" && "Create Your Account"}
              {(phase === "owner-1" || phase === "owner-2" || phase === "owner-3") && "Set Up Your Gaming Zone"}
              {(phase === "customer-1" || phase === "customer-2") && "Join a Gaming Zone"}
              {phase === "customer-done" && "You're All Set"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {phase === "role" && "Are you setting up a cafe, or joining one to play?"}
              {phase === "owner-1" && "Tell us about your gaming zone"}
              {phase === "owner-2" && "Create your admin account"}
              {phase === "owner-3" && "Add the terminals under your zone"}
              {phase === "customer-1" && "Pick the gaming cafe you play at"}
              {phase === "customer-2" && `Create your account for ${selectedStore?.name ?? "this cafe"}`}
              {phase === "customer-done" && "Show your name or phone at the counter to start playing"}
            </p>

            {ownerStepNum && (
              <div className="flex items-center gap-2 mt-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-1.5 rounded-full transition-all ${s === ownerStepNum ? "w-8 bg-indigo-600" : s < ownerStepNum ? "w-4 bg-indigo-300" : "w-4 bg-slate-200"}`} />
                ))}
              </div>
            )}
            {customerStepNum && (
              <div className="flex items-center gap-2 mt-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-1.5 rounded-full transition-all ${s === customerStepNum ? "w-8 bg-indigo-600" : s < customerStepNum ? "w-4 bg-indigo-300" : "w-4 bg-slate-200"}`} />
                ))}
              </div>
            )}
          </div>

          <div className="overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* ── Role picker ──────────────────────────────────────────── */}
              {phase === "role" && (
                <motion.div
                  key="role"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className="px-8 pb-8 space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => setPhase("owner-1")}
                    className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-left transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-indigo-100 group-hover:bg-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                      <Building2 className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">I own a gaming cafe</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Set up your gaming zone, admin account, and terminals</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPhase("customer-1")}
                    className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-left transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-indigo-100 group-hover:bg-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                      <Users className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">I'm a customer</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Join a gaming cafe that's already on GameCentral</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center space-x-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Already have an account? Sign in</span>
                  </button>
                </motion.div>
              )}

              {/* ── Owner step 1: Zone details ───────────────────────────── */}
              {phase === "owner-1" && (
                <motion.form
                  key="owner-1"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleOwnerStep1Submit}
                  className="px-8 pb-8 space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Gaming Zone Name</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={zoneName}
                        onChange={(e) => setZoneName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        placeholder="e.g. GameCentral Esports Lounge"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Address (optional)</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                      placeholder="Street address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">City (optional)</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Country Code</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={country}
                        onChange={(e) => setCountry(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-mono transition-all"
                        placeholder="IN"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Timezone</label>
                      <input
                        type="text"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-mono transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Currency</label>
                      <input
                        type="text"
                        maxLength={3}
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-mono transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start space-x-2 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resetAll}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center justify-center space-x-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ── Owner step 2: Admin account ──────────────────────────── */}
              {phase === "owner-2" && (
                <motion.form
                  key="owner-2"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleOwnerStep2Submit}
                  className="px-8 pb-8 space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Your Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        placeholder="e.g. Priya Sharma"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        placeholder="you@yourlounge.com"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start space-x-2 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPhase("owner-1")}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center justify-center space-x-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2"
                    >
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{submitting ? "Creating..." : "Create My Gaming Zone"}</span>
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ── Owner step 3: PCs ─────────────────────────────────────── */}
              {phase === "owner-3" && (
                <motion.div
                  key="owner-3"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="px-8 pb-8 space-y-4"
                >
                  <div className="flex items-start space-x-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg p-3">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Your gaming zone and admin account are ready. Add terminals now, or skip and add them later from Live PCs.</span>
                  </div>

                  {/* System types / pricing */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">PC Categories &amp; Rates</p>
                    {systemTypesList.length > 0 && (
                      <div className="space-y-1.5">
                        {systemTypesList.map((st, i) => (
                          <div key={i} className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-xs">
                            <span className="font-semibold text-slate-700">{st.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 font-mono">₹{st.hourlyBaseRate}/hr</span>
                              <button type="button" onClick={() => handleRemoveSystemType(i)} className="text-slate-400 hover:text-red-500">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <form onSubmit={handleAddSystemType} className="flex gap-2">
                      <input
                        value={typeDraft.name}
                        onChange={(e) => setTypeDraft({ ...typeDraft, name: e.target.value })}
                        placeholder="e.g. Standard PC"
                        className="flex-1 px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={typeDraft.hourlyBaseRate}
                        onChange={(e) => setTypeDraft({ ...typeDraft, hourlyBaseRate: e.target.value })}
                        placeholder="₹/hr"
                        className="w-20 px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={!typeDraft.name.trim() || !typeDraft.hourlyBaseRate}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>

                  {pcs.length > 0 && (
                    <div className="space-y-2">
                      {pcs.map((pc, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <Monitor className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="font-semibold text-slate-700 truncate">{pc.name}</span>
                            <span className="text-slate-400 font-mono">#{pc.stationNumber}</span>
                            <span className="text-slate-400 uppercase">{pc.platform}</span>
                          </div>
                          <button type="button" onClick={() => handleRemovePc(i)} className="text-slate-400 hover:text-red-600 shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAddPc} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                          {draft.count > 1 ? "Name Prefix" : "Terminal Name"}
                        </label>
                        <input
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none"
                          placeholder={draft.count > 1 ? "e.g. Standard PC" : "e.g. Station 01"}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Count</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={draft.count}
                          onChange={(e) => setDraft({ ...draft, count: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Platform</label>
                      <select
                        value={draft.platform}
                        onChange={(e) => setDraft({ ...draft, platform: e.target.value as ApiSystemPlatform })}
                        className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none uppercase"
                      >
                        {PLATFORMS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    {draft.count > 1 && draft.name.trim() && (
                      <p className="text-[10px] text-indigo-500 font-mono">
                        Will create: {draft.name.trim()} 01, {draft.name.trim()} 02 … {draft.name.trim()} {String(draft.count).padStart(2, "0")}
                      </p>
                    )}
                    {systemTypesList.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">PC Category</label>
                        <select
                          value={draft.systemTypeIndex ?? ""}
                          onChange={(e) => setDraft({ ...draft, systemTypeIndex: e.target.value === "" ? null : parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none"
                        >
                          <option value="">No category</option>
                          {systemTypesList.map((st, i) => (
                            <option key={i} value={i}>{st.name} — ₹{st.hourlyBaseRate}/hr</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowAdvanced((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
                    >
                      <span>Network & hardware (optional)</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                    </button>

                    {showAdvanced && (
                      <div className="grid grid-cols-2 gap-3">
                        <input value={draft.ipAddress} onChange={(e) => setDraft({ ...draft, ipAddress: e.target.value })} placeholder="IP address" className="px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none font-mono" />
                        <input value={draft.macAddress} onChange={(e) => setDraft({ ...draft, macAddress: e.target.value })} placeholder="MAC address" className="px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none font-mono" />
                        <input value={draft.cpu} onChange={(e) => setDraft({ ...draft, cpu: e.target.value })} placeholder="CPU" className="px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none" />
                        <input value={draft.gpu} onChange={(e) => setDraft({ ...draft, gpu: e.target.value })} placeholder="GPU" className="px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none" />
                        <input value={draft.ram} onChange={(e) => setDraft({ ...draft, ram: e.target.value })} placeholder="RAM" className="px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none" />
                        <input value={draft.monitor} onChange={(e) => setDraft({ ...draft, monitor: e.target.value })} placeholder="Monitor" className="px-3 py-1.5 border border-slate-200 text-xs rounded-lg bg-white focus:outline-none" />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!draft.name.trim()}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 border border-indigo-200/50 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>
                        {draft.count > 1
                          ? `Add ${draft.count} Terminals to List`
                          : "Add Terminal to List"}
                      </span>
                    </button>
                  </form>

                  {pcWarning && (
                    <div className="flex items-start space-x-2 bg-amber-50 border border-amber-100 text-amber-700 text-xs rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{pcWarning}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={finishOwnerSetup}
                    disabled={submitting}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{submitting ? "Finishing setup..." : pcs.length > 0 ? `Finish Setup (${pcs.length} terminal${pcs.length > 1 ? "s" : ""})` : "Skip & Go to Dashboard"}</span>
                  </button>
                </motion.div>
              )}

              {/* ── Customer step 1: pick a cafe ──────────────────────────── */}
              {phase === "customer-1" && (
                <motion.div
                  key="customer-1"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className="px-8 pb-8 space-y-4"
                >
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                      placeholder="Search by name or city..."
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start space-x-2 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {storesLoading ? (
                      <p className="text-xs text-slate-400 text-center py-8">Loading gaming zones…</p>
                    ) : filteredStores.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-8">
                        {stores.length === 0 ? "No gaming zones are registered yet." : "No zones match your search."}
                      </p>
                    ) : (
                      filteredStores.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setSelectedStore(s); setPhase("customer-2"); }}
                          className="w-full flex items-center gap-3 p-3 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-left transition-all group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-indigo-100 group-hover:bg-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                            <Gamepad2 className="w-4 h-4 text-indigo-600 group-hover:text-white transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{s.name}</p>
                            {(s.city || s.address) && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{[s.address, s.city].filter(Boolean).join(", ")}</span>
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={resetAll}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center space-x-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </motion.div>
              )}

              {/* ── Customer step 2: create account ───────────────────────── */}
              {phase === "customer-2" && (
                <motion.form
                  key="customer-2"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleCustomerAccountSubmit}
                  className="px-8 pb-8 space-y-4"
                >
                  {selectedStore && (
                    <div className="flex items-center gap-2.5 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                      <Gamepad2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-bold text-indigo-900">{selectedStore.name}</span>
                      <button type="button" onClick={() => setPhase("customer-1")} className="ml-auto text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">Change</button>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Your Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        placeholder="e.g. Arjun Mehta"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={custEmail}
                        onChange={(e) => setCustEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        placeholder="you@example.com"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Phone (optional)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        placeholder="+15550001234"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCustPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={custPassword}
                        onChange={(e) => setCustPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustPassword(!showCustPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showCustPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCustPassword ? "text" : "password"}
                        required
                        value={custConfirmPassword}
                        onChange={(e) => setCustConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start space-x-2 bg-red-50 border border-red-100 text-red-700 text-xs rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPhase("customer-1")}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center justify-center space-x-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2"
                    >
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{submitting ? "Joining..." : "Create Account & Join"}</span>
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ── Customer done ──────────────────────────────────────────── */}
              {phase === "customer-done" && (
                <motion.div
                  key="customer-done"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="px-8 pb-8 space-y-4 text-center"
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <p className="text-sm text-slate-700">
                    You're registered at <span className="font-bold">{selectedStore?.name}</span>. Give your name or phone number to the staff at the counter to start your first session.
                  </p>
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Back to Sign In
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5">
          GameCentral Operations Platform
        </p>
      </motion.div>
    </div>
    </div>
  );
}
