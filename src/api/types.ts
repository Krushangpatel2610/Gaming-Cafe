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

export interface ApiStore {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  currency?: string;
}

// Real customers have no membership-tier or avatar concept — those were
// invented in the old mock data with nothing behind them. This is the
// actual shape from GET /stores/:storeId/customers (see customers/model.ts
// on the backend).
export interface ApiCustomer {
  userId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  suspendedAt: string | null;
  suspendedReason: string | null;
  creditsBalance: string;
  totalSpend: string;
  totalSessions: number;
  totalPlayMinutes: number;
  lastVisitAt: string | null;
  joinedAt: string;
}

export interface ApiGame {
  id: string;
  name: string;
  genre?: string | null;
  executablePath?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ApiCampaignType =
  | "percentage_off"
  | "fixed_off"
  | "bonus_minutes"
  | "bonus_credits"
  | "happy_hour"
  | "first_visit";
export type ApiCampaignStatus = "draft" | "scheduled" | "active" | "paused" | "expired" | "cancelled";

export interface ApiCampaign {
  id: string;
  storeId: string;
  name: string;
  campaignType: ApiCampaignType;
  value: string;
  validFrom: string;
  validUntil: string;
  minTier: number;
  maxRedemptions?: number | null;
  currentRedemptions: number;
  maxPerUser?: number | null;
  status: ApiCampaignStatus;
  description?: string | null;
  terms?: string | null;
  // Only present on the single-campaign detail response (GET /:id), not the list.
  redemptionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiSystemTypeSpecs {
  gpu?: string;
  cpu?: string;
  ram?: string;
  storage?: string;
  monitor?: string;
  peripherals?: string;
  extras?: string;
}

export interface ApiSystemType {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  hourlyBaseRate: string;
  specs?: ApiSystemTypeSpecs;
  sortOrder?: number;
  isActive: boolean;
}
