export enum PCStatus {
  AVAILABLE = "Available",
  IN_USE = "In-Use",
  MAINTENANCE = "Maintenance",
  OFFLINE = "Offline"
}

export enum PCGroup {
  VIP = "VIP Zone",
  STANDARD = "Standard Zone",
  CONSOLE = "Console Lounge",
  STREAMING = "Streaming Booth"
}

export interface PCSpecs {
  cpu: string;
  gpu: string;
  ram: string;
  monitor: string;
}

export interface PC {
  id: string;
  name: string;
  group: PCGroup;
  status: PCStatus;
  ip: string;
  specs: PCSpecs;
  activeSessionId?: string;
  currentUser?: string;
  timeRemaining?: number; // in seconds
  totalPlayTimeToday?: number; // in minutes
}

export interface Session {
  id: string;
  pcId: string;
  pcName: string;
  customerName: string;
  customerId?: string; // empty if guest
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  remainingSeconds?: number;
  ratePerHour: number;
  totalCost: number;
  status: "Active" | "Completed" | "Cancelled";
  paymentStatus: "Paid" | "Unpaid";
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipLevel: "Bronze" | "Silver" | "Gold" | "Platinum";
  balance: number;
  totalSpend: number;
  totalPlayTime: number; // in hours
  registeredAt: string;
  avatarUrl?: string;
  status: "Active" | "Suspended";
}

export interface Game {
  id: string;
  title: string;
  genre: string;
  developer: string;
  launchCount: number;
  playTimeHours: number;
  sizeGB: number;
  imageUrl: string;
  status: "Ready" | "Updating" | "Offline";
  updateProgress?: number; // 0-100
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  badge: string;
  discountType: "Percentage" | "HourlyRate" | "Bundle";
  value: string;
  code: string;
  imageUrl: string;
  status: "Active" | "Upcoming" | "Draft" | "Expired";
  startDate: string;
  endDate: string;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  playerName: string;
  avatarUrl?: string;
  gameTitle: string;
  statName: string; // e.g. "K/D Ratio", "Speedrun Time", "High Score"
  statValue: string;
  reward: string;
  date: string;
}

export interface SystemSettings {
  loungeName: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  standardRate: number;
  vipRate: number;
  consoleRate: number;
  streamingRate: number;
  openingTime: string;
  closingTime: string;
  allowGuests: boolean;
  autoLockScreen: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: "PC" | "Session" | "Customer" | "System" | "Billing";
  message: string;
  operator: string;
  severity: "info" | "warning" | "success" | "danger";
}
