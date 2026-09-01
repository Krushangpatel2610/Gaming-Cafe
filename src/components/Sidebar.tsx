import React from "react";
import {
  LayoutDashboard,
  Monitor,
  Clock,
  Users,
  Gamepad2,
  Tag,
  Trophy,
  Settings,
  LogOut,
  CalendarDays,
  Receipt,
  QrCode,
  BarChart3,
  ShieldQuestion,
  Bell,
  UserCog
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loungeName: string;
}

export default function Sidebar({ activeTab, setActiveTab, loungeName }: SidebarProps) {
  const { admin, logout } = useAuth();
  const initials = admin?.name
    ? admin.name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase()
    : "SM";

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "live_pcs", label: "Live PCs", icon: Monitor },
    { id: "sessions", label: "Sessions", icon: Clock },
    { id: "bookings", label: "Bookings", icon: CalendarDays },
    { id: "customers", label: "Customers", icon: Users },
    { id: "games", label: "Game Library", icon: Gamepad2 },
    { id: "offers", label: "Offers & Promos", icon: Tag },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  const financeItems = [
    { id: "billing", label: "Billing", icon: Receipt },
    { id: "payments", label: "Payments", icon: QrCode },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "disputes", label: "Disputes", icon: ShieldQuestion },
  ];

  const adminItems = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "team", label: "Team & Access", icon: UserCog },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside id="app-sidebar" className="fixed top-0 left-0 h-screen w-64 bg-white text-slate-800 flex flex-col z-30 border-r border-slate-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-200 flex items-center space-x-3 bg-white">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
          <Gamepad2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 font-display leading-tight">
            {loungeName || "GameCentral"}
          </h1>
          <p className="text-[10px] text-slate-400 font-mono">Operations Center</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto bg-white">
        <p className="px-3 mb-2.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
          Management
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`sidebar-tab-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-150 group text-left ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
            >
              <Icon className={`w-4.5 h-4.5 transition-transform duration-150 ${
                isActive ? "scale-105 text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </button>
          );
        })}

        <p className="px-3 mb-2.5 mt-5 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
          Finance & Ops
        </p>
        {financeItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`sidebar-tab-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-150 group text-left ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
            >
              <Icon className={`w-4.5 h-4.5 transition-transform duration-150 ${
                isActive ? "scale-105 text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </button>
          );
        })}

        <p className="px-3 mb-2.5 mt-5 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
          Admin
        </p>
        {adminItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`sidebar-tab-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-150 group text-left ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100/50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
            >
              <Icon className={`w-4.5 h-4.5 transition-transform duration-150 ${
                isActive ? "scale-105 text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
              }`} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Staff profile footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center space-x-3 p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{admin?.name || "Staff Operator"}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{admin?.email || "Not signed in"}</p>
          </div>
          <button
            title="Log out"
            onClick={logout}
            className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-slate-400 font-mono">
          {loungeName || "GameCentral"} Platform
        </p>
      </div>
    </aside>
  );
}
