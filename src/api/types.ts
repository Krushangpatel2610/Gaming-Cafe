// TS shapes for the GZ Gaming Platform backend, mirrored from `frontend-api-reference (1).md`.
// Kept separate from ../types.ts (the UI-facing model) since several UI fields have no backend source.

export type ApiAdminRole = "super_admin" | "admin" | "staff";

export interface ApiAdmin {
  id: string;
  name: string;
  email: string;
  role: ApiAdminRole;
  storeId: string;
  permissions?: Record<string, boolean>;
  lastLoginAt?: string;
  isActive?: boolean;
}

export interface ApiAdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: ApiAdmin;
}

export type ApiSystemPlatform = "pc" | "ps5" | "ps4" | "xbox" | "vr" | "other";
export type ApiSystemStatus = "available" | "in_use" | "maintenance" | "offline";

export interface ApiSystemSpecs {
  gpu?: string;
  cpu?: string;
  ram?: string;
  storage?: string;
  monitor?: string;
  peripherals?: string;
  extras?: string;
}

export interface ApiSystem {
  id: string;
  storeId: string;
  name: string;
  stationNumber: string;
  platform: ApiSystemPlatform;
  systemTypeId?: string;
  status: ApiSystemStatus;
  ipAddress?: string;
  macAddress?: string;
  specs?: ApiSystemSpecs;
  isAgentOnline?: boolean;
  currentSessionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ApiSessionStatus = "in_progress" | "completed" | "cancelled" | "disputed";

export interface ApiSession {
  id: string;
  storeId: string;
  bookingId: string | null;
  userId: string | null;
  systemId: string;
  status: ApiSessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  isBilled: boolean;
  walkInPhone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ApiBookingType = "paid" | "reserved" | "walk_in";
export type ApiBookingStatus = "pending" | "confirmed" | "checked_in" | "cancelled" | "no_show";

export interface ApiBooking {
  id: string;
  storeId: string;
  systemId: string;
  userId?: string;
  walkInPhone?: string;
  scheduledStart: string;
  scheduledEnd: string;
  bookingType: ApiBookingType;
  status: ApiBookingStatus;
  isPaid?: boolean;
  notes?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
