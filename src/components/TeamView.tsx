import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { UserPlus, ShieldCheck, X, UserMinus, Crown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { listStoreAdmins, createStoreAdmin, updateStoreAdmin, deactivateStoreAdmin, CreateStoreAdminBody } from "../api/storeAdmins";
import { ApiStoreAdmin, ApiStoreAdminRole } from "../api/types";

interface TeamViewProps {
  onNotify: (message: string, severity: "info" | "success" | "danger" | "warning") => void;
}

const ROLE_BADGE: Record<ApiStoreAdminRole, string> = {
  super_admin: "bg-purple-50 text-purple-700 border-purple-200",
  admin: "bg-indigo-50 text-indigo-700 border-indigo-200",
  staff: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function TeamView({ onNotify }: TeamViewProps) {
  const { storeId, admin } = useAuth();
  const [admins, setAdmins] = useState<ApiStoreAdmin[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<"admin" | "staff">("staff");

  const isSuperAdmin = admin?.role === "super_admin";

  const refresh = async () => {
    if (!storeId) return;
    try {
      const { data } = await listStoreAdmins(storeId, { limit: 100 });
      setAdmins(data);
    } catch (err) {
      onNotify(`Failed to load team: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    const body: CreateStoreAdminBody = { name, email, password, role };
    try {
      await createStoreAdmin(storeId, body);
      onNotify(`${name} invited as ${role}.`, "success");
      setShowCreateModal(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("staff");
      await refresh();
    } catch (err) {
      onNotify(`Failed to create admin: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const handleRoleChange = async (target: ApiStoreAdmin, nextRole: "admin" | "staff") => {
    if (!storeId) return;
    try {
      await updateStoreAdmin(storeId, target.id, { role: nextRole });
      onNotify(`${target.name || target.email}'s role updated to ${nextRole}.`, "success");
      await refresh();
    } catch (err) {
      onNotify(`Failed to update role: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const handleDeactivate = async (target: ApiStoreAdmin) => {
    if (!storeId) return;
    if (!window.confirm(`Deactivate ${target.name || target.email}? They will lose access immediately.`)) return;
    try {
      await deactivateStoreAdmin(storeId, target.id);
      onNotify(`${target.name || target.email} deactivated.`, "warning");
      await refresh();
    } catch (err) {
      onNotify(`Failed to deactivate admin: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Team & Access</h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSuperAdmin ? "Manage admin and staff accounts for this store." : "Only super admins can manage team accounts."}
          </p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {admins.map((a) => (
          <div key={a.id} className={`bg-white rounded-xl border p-5 space-y-3 shadow-precision ${!a.isActive ? "opacity-50 border-slate-200" : "border-slate-200"}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {a.role === "super_admin" ? <Crown className="w-4 h-4 text-purple-500 shrink-0" /> : <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{a.name || "Unnamed"}</p>
                  <p className="text-[10px] text-slate-400 truncate">{a.email}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${ROLE_BADGE[a.role]}`}>{a.role.replace("_", " ")}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex justify-between border-t border-slate-100 pt-2">
              <span>{a.isActive ? "Active" : "Deactivated"}</span>
              <span>{a.lastLoginAt ? `Last login: ${new Date(a.lastLoginAt).toLocaleDateString()}` : "Never logged in"}</span>
            </div>
            {isSuperAdmin && a.role !== "super_admin" && a.id !== admin?.id && a.isActive && (
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={a.role}
                  onChange={(e) => handleRoleChange(a, e.target.value as "admin" | "staff")}
                  className="flex-1 px-2 py-1.5 border border-slate-200 text-[11px] rounded-lg bg-slate-50"
                >
                  <option value="admin">admin</option>
                  <option value="staff">staff</option>
                </select>
                <button onClick={() => handleDeactivate(a)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg" title="Deactivate">
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL: Invite */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Invite Team Member</h3>
                <p className="text-xs text-slate-400 mt-1">They'll get an email with a link to sign in.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Full Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Temporary Password</label>
                <input required type="text" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono" placeholder="min 8 characters" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setRole("admin")} className={`py-2 text-xs font-bold rounded-lg border ${role === "admin" ? "bg-indigo-600 border-indigo-700 text-white" : "bg-slate-50 border-slate-200 text-slate-600"}`}>Admin</button>
                  <button type="button" onClick={() => setRole("staff")} className={`py-2 text-xs font-bold rounded-lg border ${role === "staff" ? "bg-indigo-600 border-indigo-700 text-white" : "bg-slate-50 border-slate-200 text-slate-600"}`}>Staff</button>
                </div>
              </div>
              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10">Send Invite</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
