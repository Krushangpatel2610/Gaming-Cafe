// TS shapes for the GZ Gaming Platform backend, mirrored from `frontend-api-reference (1).md`.
// Kept separate from ../types.ts (the UI-facing model) since several UI fields have no backend source.

export interface ApiUser {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface ApiUserLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
  isNewUser?: boolean;
}

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

// ── Bookings (extended beyond ApiBooking above) ─────────────────────────────

export interface ApiAvailabilityResult {
  available: boolean;
  conflictingBookingId?: string;
}

// ── Billing ──────────────────────────────────────────────────────────────

export type ApiBillingReason =
  | "session_complete"
  | "manual"
  | "override"
  | "dispute_adjustment";

export interface ApiBillingEntry {
  id: string;
  storeId: string;
  sessionId: string;
  userId: string | null;
  systemId: string;
  billedFrom: string;
  billedUntil: string;
  billedMinutes: number;
  baseRate: string;
  appliedMultiplier: string;
  appliedRuleId: string | null;
  grossAmount: string;
  discountAmount: string;
  netAmount: string;
  billingReason: string;
  notes: string | null;
  createdAt: string;
}

export interface ApiBillingOverride {
  id: string;
  storeId: string;
  adminId: string;
  sessionId: string;
  billingId: string;
  overrideType: string;
  originalValue: string;
  overrideValue: string;
  reason: string;
  createdAt: string;
}

export interface ApiBillingRevenueSummaryRow {
  period: string;
  totalRecords: number;
  totalGross: string;
  totalDiscounts: string;
  totalNet: string;
  totalMinutes: number;
}

export interface ApiBillingRevenueSummary {
  summary: ApiBillingRevenueSummaryRow[];
  dateFrom: string | null;
  dateTo: string | null;
  groupBy: string;
}

// ── Payments (QR-based, no gateway) ─────────────────────────────────────────

export type ApiPaymentMethod = "cash" | "card" | "upi" | "wallet" | "credits";
export type ApiPaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface ApiPayment {
  id: string;
  storeId: string;
  billingId: string | null;
  userId: string | null;
  amount: string;
  method: ApiPaymentMethod;
  status: ApiPaymentStatus;
  transactionRef: string | null;
  idempotencyKey: string | null;
  gatewayId: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiPaymentDetail extends ApiPayment {
  gatewayResponse: Record<string, unknown>;
}

export interface ApiReconciliationRow {
  method: string;
  status: string;
  count: number;
  totalAmount: string;
}

export interface ApiPaymentQr {
  upiQrImage: string | null;
  upiId: string | null;
}

export interface ApiBookingConfig {
  bookingWindowMinutes: number;
  paymentWindowMinutes: number;
  noShowGraceMinutes: number;
  checkInEarlyMinutes: number;
}

// ── Disputes ─────────────────────────────────────────────────────────────

export type ApiDisputeStatus = "open" | "under_review" | "resolved" | "withdrawn";
export type ApiDisputeResolution = "upheld" | "partial_refund" | "full_refund" | "credit_issued";

export interface ApiDispute {
  id: string;
  storeId: string;
  billingId: string;
  sessionId: string;
  userId: string | null;
  status: ApiDisputeStatus;
  reason: string;
  disputeAmount: string;
  resolution: ApiDisputeResolution | null;
  resolutionAmount: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Notifications ────────────────────────────────────────────────────────

export type ApiNotificationChannel = "push" | "email" | "in_app" | "sms";
export type ApiNotificationStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export interface ApiNotification {
  id: string;
  storeId: string | null;
  userId: string | null;
  channel: ApiNotificationChannel;
  status: ApiNotificationStatus;
  title: string;
  body: string;
  scheduledAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

// ── Store Admins / Team ──────────────────────────────────────────────────

export type ApiStoreAdminRole = "super_admin" | "admin" | "staff";

export interface ApiStoreAdmin {
  id: string;
  storeId: string;
  name: string | null;
  email: string;
  role: ApiStoreAdminRole;
  permissions: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

// ── Analytics ────────────────────────────────────────────────────────────

export interface ApiDashboardAnalytics {
  date: string;
  totalSessions: number;
  totalRevenue: string;
  totalNetRevenue: string;
  totalMinutesPlayed: number;
  avgSessionDurationMinutes: string;
  occupancyRate: string;
  uniquePlayers: number;
  newPlayers: number;
  peakHour: number | null;
  totalBookingNoShows: number;
  creditsEarned: string;
  creditsRedeemed: string;
  paymentBreakdown: Record<string, unknown>;
  source: "summary" | "live";
}

export interface ApiRevenueAnalyticsRow {
  date: string;
  revenue: string;
  netRevenue: string;
  discounts: string;
  sessions: number;
  minutes: number;
}

export interface ApiRevenueAnalytics {
  data: ApiRevenueAnalyticsRow[];
  dateFrom: string | null;
  dateTo: string | null;
  groupBy: "day" | "week" | "month";
}

export interface ApiHourlySummaryRow {
  storeId: string;
  summaryDate: string;
  hourOfDay: number;
  sessionsStarted: number;
  sessionsEnded: number;
  activeSessionsPeak: number;
  revenue: string;
  systemsInUse: number;
  totalSystems: number;
}

export interface ApiUtilizationAnalytics {
  data: ApiHourlySummaryRow[];
}

export interface ApiSessionStatsAnalytics {
  totalSessions: number;
  completed: number;
  cancelled: number;
  avgDurationMinutes: string;
  totalMinutes: number;
  walkInCount: number;
  bookingCount: number;
}

export interface ApiPlayerAnalytics {
  uniquePlayers: number;
  newPlayers: number;
  returningPlayers: number;
  topPlayerMinutes: number;
}

export interface ApiSystemPerformanceRow {
  systemId: string;
  name: string;
  stationNumber: number;
  platform: string;
  totalSessions: number;
  totalMinutes: number;
  totalRevenue: string;
  utilizationRate: string;
}

export interface ApiSystemPerformanceAnalytics {
  systems: ApiSystemPerformanceRow[];
}

// ── User Dashboard ────────────────────────────────────────────────────────

export interface ApiGameSummary {
  id: string;
  name: string;
  genre: string | null;
}

export interface ApiAvailableSystem {
  id: string;
  name: string;
  stationNumber: number;
  platform: ApiSystemPlatform;
  systemTypeId: string | null;
  specs: Record<string, unknown>;
  games: ApiGameSummary[];
}

export interface ApiUserActiveSession {
  sessionId: string;
  systemId: string;
  systemName: string;
  stationNumber: number;
  startedAt: string;
  timeRemainingMinutes: number;
}

export interface ApiUserDashboard {
  balance: {
    current: string;
    available: string;
  };
  activeSession: ApiUserActiveSession | null;
  mostPlayedGames: Array<{
    id: string;
    name: string;
    genre: string | null;
    playCount: number;
  }>;
}

// ── Loyalty ─────────────────────────────────────────────────────────────

export type ApiLoyaltyTransactionType = "earned" | "redeemed" | "admin_adjust" | "expired";

export interface ApiLoyaltyTransaction {
  id: string;
  storeId: string;
  userId: string;
  transactionType: ApiLoyaltyTransactionType;
  points: number;
  balanceAfter: number;
  sourceId: string | null;
  sourceType: string | null;
  description: string | null;
  createdAt: string;
}

export interface ApiLoyaltySettings {
  storeId: string;
  pointsPerHour: string;
  isActive: boolean;
  updatedAt: string;
}

export interface ApiLoyaltyReward {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  pointsCost: number;
  stock: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Credit Ledger Transactions ──────────────────────────────────────────────

export type ApiCreditTransactionType = "earned" | "redeemed" | "bonus" | "admin_adjust" | "expired" | "refund";

export interface ApiCreditTransaction {
  id: string;
  storeId: string;
  userId: string;
  transactionType: ApiCreditTransactionType;
  amount: string;
  balanceAfter: string;
  sourceId: string | null;
  sourceType: string | null;
  description: string | null;
  expiresAt: string | null;
  createdAt: string;
}

