import { apiGet, apiGetPaginated, apiPatch, apiPost, apiDelete, ApiListResult } from "./client";

export interface ApiGamepassPackage {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  validityDays: number;
  validityUnit?: string;
  availableDuration?: number | null;
  availableUnit?: "days" | "hours" | "hrs" | null;
  availableUntil?: string | null;
  applicableSystemTypeIds: string[];
  dayOfWeek: number[];
  startTime: string;
  endTime: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function listPackages(storeId: string): Promise<ApiGamepassPackage[]> {
  return apiGet<ApiGamepassPackage[]>(`/stores/${storeId}/gamepass/packages/all`);
}

export interface CreatePackageBody {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  validityDays?: number;
  validityUnit?: "days" | "hours" | "hrs";
  availableDuration?: number | null;
  availableUnit?: "days" | "hours" | "hrs";
  applicableSystemTypeIds?: string[];
  dayOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  sortOrder?: number;
}

export function createPackage(storeId: string, body: CreatePackageBody): Promise<{ package: ApiGamepassPackage }> {
  return apiPost<{ package: ApiGamepassPackage }>(`/stores/${storeId}/gamepass/packages`, body);
}

export interface UpdatePackageBody {
  name?: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  validityDays?: number;
  validityUnit?: "days" | "hours" | "hrs";
  availableDuration?: number | null;
  availableUnit?: "days" | "hours" | "hrs";
  applicableSystemTypeIds?: string[];
  dayOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export function updatePackage(storeId: string, packageId: string, body: UpdatePackageBody): Promise<{ package: ApiGamepassPackage }> {
  return apiPatch<{ package: ApiGamepassPackage }>(`/stores/${storeId}/gamepass/packages/${packageId}`, body);
}

export function deletePackage(storeId: string, packageId: string): Promise<unknown> {
  return apiDelete(`/stores/${storeId}/gamepass/packages/${packageId}`);
}

export function assignPackageToSystem(storeId: string, packageId: string, systemId: string): Promise<unknown> {
  return apiPost(`/stores/${storeId}/gamepass/packages/${packageId}/assign`, { systemId });
}

export function unassignPackageFromSystem(storeId: string, packageId: string, systemId: string): Promise<unknown> {
  return apiDelete(`/stores/${storeId}/gamepass/packages/${packageId}/assign?systemId=${systemId}`);
}

export function getPackageSystems(storeId: string, packageId: string): Promise<string[]> {
  return apiGet<string[]>(`/stores/${storeId}/gamepass/packages/${packageId}/systems`);
}

// ── Gamepass purchases / redemptions (player-requested, staff-reviewed) ──

export type ApiGamepassRedemptionStatus = "pending" | "confirmed" | "rejected" | "expired" | "consumed";

export interface ApiGamepassPurchase {
  id: string;
  storeId: string;
  userId: string;
  packageId: string;
  status: ApiGamepassRedemptionStatus;
  remainingMinutes: number | null;
  purchasedAt: string | null;
  expiresAt: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  package?: ApiGamepassPackage;
}

export function listPendingPurchases(
  storeId: string,
  params?: { status?: ApiGamepassRedemptionStatus; page?: number; limit?: number }
): Promise<ApiListResult<ApiGamepassPurchase[]>> {
  const entries = Object.entries({ status: "pending", limit: 50, ...params }).filter(([, v]) => v !== undefined) as [string, string | number][];
  const qs = entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}` : "";
  return apiGetPaginated<ApiGamepassPurchase[]>(`/stores/${storeId}/gamepass/purchases${qs}`);
}

export function confirmPurchase(storeId: string, purchaseId: string): Promise<ApiGamepassPurchase> {
  return apiPost<ApiGamepassPurchase>(`/stores/${storeId}/gamepass/purchases/${purchaseId}/confirm`);
}

export function rejectPurchase(
  storeId: string,
  purchaseId: string,
  reason?: string
): Promise<ApiGamepassPurchase> {
  return apiPost<ApiGamepassPurchase>(`/stores/${storeId}/gamepass/purchases/${purchaseId}/reject`, {
    reason: (reason && reason.trim().length >= 3) ? reason.trim() : "Payment not received or invalid",
  });
}
