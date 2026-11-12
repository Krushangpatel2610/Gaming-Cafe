import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  UserPlus,
  ShieldCheck,
  X,
  UserMinus,
  Crown,
  Wrench,
  KeyRound,
  Trash2,
  Power,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import {
  listStoreAdmins,
  createStoreAdmin,
  deactivateStoreAdmin,
  CreateStoreAdminBody,
} from "../api/storeAdmins";
import {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../api/staff";
import { ApiStaff, ApiStoreAdmin, ApiStoreAdminRole } from "../api/types";

interface TeamViewProps {
  currency: string;
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
  const [staffList, setStaffList] = useState<ApiStaff[]>([]);

  // Invite Admin modal state
  const [showCreateAdminModal, setShowCreateAdminModal] = useState<boolean>(false);
  const [adminName, setAdminName] = useState<string>("");
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");

  // Create / Edit Staff modal state
  const [showStaffModal, setShowStaffModal] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<ApiStaff | null>(null);
  const [staffName, setStaffName] = useState<string>("");
  const [staffEmail, setStaffEmail] = useState<string>("");
  const [staffPhone, setStaffPhone] = useState<string>("");
  const [staffPassword, setStaffPassword] = useState<string>("");

  const isSuperAdmin = admin?.role === "super_admin";
  const canManageStaff = admin?.role === "super_admin" || admin?.role === "admin";

  const refresh = async () => {
    if (!storeId) return;
    if (isSuperAdmin) {
      try {
        const { data } = await listStoreAdmins(storeId, { limit: 100 });
        setAdmins(data);
      } catch (err) {
        onNotify(`Failed to load admins: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
      }
    }
    if (canManageStaff) {
      try {
        const { data } = await listStaff(storeId, { limit: 100 });
        setStaffList(data);
      } catch (err) {
        onNotify(`Failed to load staff: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
      }
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, isSuperAdmin, canManageStaff]);

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    const body: CreateStoreAdminBody = {
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    };
    try {
      await createStoreAdmin(storeId, body);
      onNotify(`${adminName} invited as Admin.`, "success");
      setShowCreateAdminModal(false);
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      await refresh();
    } catch (err) {
      onNotify(`Failed to create admin: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const handleDeactivateAdmin = async (target: ApiStoreAdmin) => {
    if (!storeId) return;
    if (!window.confirm(`Deactivate ${target.name || target.email}? They will lose admin access immediately.`)) return;
    try {
      await deactivateStoreAdmin(storeId, target.id);
      onNotify(`${target.name || target.email} deactivated.`, "warning");
      await refresh();
    } catch (err) {
      onNotify(`Failed to deactivate admin: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const openCreateStaff = () => {
    setEditingStaff(null);
    setStaffName("");
    setStaffEmail("");
    setStaffPhone("");
    setStaffPassword("");
    setShowStaffModal(true);
  };

  const openEditStaff = (member: ApiStaff) => {
    setEditingStaff(member);
    setStaffName(member.name);
    setStaffEmail(member.email);
    setStaffPhone(member.phone || "");
    setStaffPassword("");
    setShowStaffModal(true);
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    try {
      if (editingStaff) {
        await updateStaff(storeId, editingStaff.id, {
          name: staffName,
          email: staffEmail,
          phone: staffPhone.trim() || null,
          ...(staffPassword.trim() ? { password: staffPassword } : {}),
        });
        onNotify(`Staff account ${staffName} updated.`, "success");
      } else {
        await createStaff(storeId, {
          name: staffName,
          email: staffEmail,
          phone: staffPhone.trim() || null,
          password: staffPassword,
        });
        onNotify(`Staff account created for ${staffName}.`, "success");
      }
      setShowStaffModal(false);
      await refresh();
    } catch (err) {
      onNotify(`Failed to save staff account: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const handleToggleStaffActive = async (member: ApiStaff) => {
    if (!storeId) return;
    try {
      await updateStaff(storeId, member.id, { isActive: !member.isActive });
      onNotify(`${member.name} ${member.isActive ? "disabled" : "re-enabled"}.`, member.isActive ? "warning" : "success");
      await refresh();
    } catch (err) {
      onNotify(`Failed to update staff status: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  const handleDeleteStaff = async (member: ApiStaff) => {
    if (!storeId) return;
    if (!window.confirm(`Delete staff account "${member.name}" (${member.email})?`)) return;
    try {
      await deleteStaff(storeId, member.id);
      onNotify(`${member.name} removed from staff.`, "warning");
      await refresh();
    } catch (err) {
      onNotify(`Failed to delete staff: ${err instanceof ApiError ? err.message : "unknown error"}`, "danger");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
      {/* SECTION 1: Staff (PC Maintenance Login) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">Staff & Maintenance Access</h2>
            <p className="text-xs text-slate-400 mt-1">
              {canManageStaff
                ? "Staff accounts can sign into Maintenance Login on gaming PCs without sharing admin dashboard credentials."
                : "Only Admins and Super Admins can manage staff credentials."}
            </p>
          </div>
          {canManageStaff && (
            <button onClick={openCreateStaff} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          )}
        </div>

        {canManageStaff && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {staffList.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                No staff accounts created yet. Add a staff member to issue dedicated Maintenance Login credentials.
              </div>
            ) : (
              staffList.map((s) => (
                <div key={s.id} className={`bg-white rounded-xl border p-5 space-y-3 shadow-precision ${!s.isActive ? "opacity-60 border-slate-200" : "border-slate-200"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Wrench className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{s.email}</p>
                        {s.phone && <p className="text-[10px] text-slate-400 font-mono truncate">{s.phone}</p>}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${s.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {s.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex justify-between border-t border-slate-100 pt-2">
                    <span>Maintenance Access</span>
                    <span>{s.lastLoginAt ? `Last login: ${new Date(s.lastLoginAt).toLocaleDateString()}` : "Never logged in"}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => openEditStaff(s)}
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Edit / Password</span>
                    </button>
                    <button
                      onClick={() => handleToggleStaffActive(s)}
                      className={`p-1.5 border rounded-lg ${s.isActive ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"}`}
                      title={s.isActive ? "Disable account" : "Enable account"}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(s)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg"
                      title="Delete staff member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* SECTION 2: Store Admins (Super Admin Managed) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Store Admins</h3>
            <p className="text-xs text-slate-400 mt-1">
              {isSuperAdmin
                ? "Manage dashboard admin and super admin accounts (Admins can also log into Maintenance Login on this store's PCs)."
                : "Super Admins manage store admin dashboard accounts."}
            </p>
          </div>
          {isSuperAdmin && (
            <button onClick={() => setShowCreateAdminModal(true)} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              <span>Invite Admin</span>
            </button>
          )}
        </div>

        {isSuperAdmin && (
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
                {a.role !== "super_admin" && a.id !== admin?.id && a.isActive && (
                  <div className="flex justify-end pt-1">
                    <button onClick={() => handleDeactivateAdmin(a)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[11px] font-semibold flex items-center gap-1" title="Deactivate">
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Deactivate</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL: Create / Edit Staff */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">{editingStaff ? "Edit Staff Credentials" : "Add Staff Member"}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {editingStaff ? "Leave password blank to keep current password." : "Credentials work for Maintenance Login on this gaming zone's PCs."}
                </p>
              </div>
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleStaffSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Full Name</label>
                <input required value={staffName} onChange={(e) => setStaffName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email</label>
                <input required type="email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Phone (Optional)</label>
                <input type="text" value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono" placeholder="+91..." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {editingStaff ? "New Password (Optional)" : "Password"}
                </label>
                <input
                  required={!editingStaff}
                  type="text"
                  minLength={6}
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono"
                  placeholder={editingStaff ? "Leave blank to keep existing" : "min 6 characters"}
                />
              </div>
              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowStaffModal(false)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10">
                  {editingStaff ? "Save Changes" : "Create Staff"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Invite Admin */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Invite Admin</h3>
                <p className="text-xs text-slate-400 mt-1">They'll get an email with a link to sign into the Admin Dashboard.</p>
              </div>
              <button onClick={() => setShowCreateAdminModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateAdminSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Full Name</label>
                <input required value={adminName} onChange={(e) => setAdminName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email</label>
                <input required type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Temporary Password</label>
                <input required type="text" minLength={8} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg bg-slate-50 font-mono" placeholder="min 8 characters" />
              </div>
              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateAdminModal(false)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold">Send Invite</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
