import { apiGet, apiGetPaginated, apiPatch, apiPost } from "./client";
import { ApiAdmin, ApiBookingConfig, ApiPaymentQr, ApiStore } from "./types";

export function updateStore(storeId: string, body: { name?: string }): Promise<ApiStore> {
  return apiPatch<ApiStore>(`/stores/${storeId}`, body);
}

// Public — the "which gaming cafe are you signing up for" picker in the
// customer signup flow. Active stores only, same list anyone browsing
// without an account would see.
export async function listActiveStores(params?: { page?: number; limit?: number; city?: string }) {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined) as [string, string | number][];
  const qs = entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}` : "";
  return apiGetPaginated<ApiStore[]>(`/stores${qs}`);
}

// Authenticated read of the admin's own store — all roles, unlike the
// public GET /stores/:slug lookup which needs the slug, not the ID.
export function getStoreProfile(storeId: string): Promise<ApiStore> {
  return apiGet(`/stores/${storeId}/profile`);
}

export interface CreateStoreBody {
  name: string;
  slug?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

// Public — self-service onboarding. Creates the store and its first
// super_admin atomically. No auth required, no token returned; the caller
// logs in separately right after with the credentials just set.
export function createStore(body: CreateStoreBody): Promise<{ store: ApiStore; admin: ApiAdmin }> {
  return apiPost(`/stores`, body);
}

export function getBookingConfig(storeId: string): Promise<ApiBookingConfig> {
  return apiGet(`/stores/${storeId}/config`);
}

export function updateBookingConfig(
  storeId: string,
  body: Partial<ApiBookingConfig>
): Promise<ApiBookingConfig> {
  return apiPatch(`/stores/${storeId}/config`, body);
}

export function getPaymentQr(storeId: string): Promise<ApiPaymentQr> {
  return apiGet(`/stores/${storeId}/payment-qr`);
}

export function updatePaymentQr(
  storeId: string,
  body: { upiQrImage?: string; upiId?: string }
): Promise<ApiPaymentQr> {
  return apiPatch(`/stores/${storeId}/payment-qr`, body);
}

export interface ApiKioskSettings {
  allowedApps: string[];
  warningMinutes: number;
}

export function getKioskSettings(storeId: string): Promise<ApiKioskSettings> {
  return apiGet(`/stores/${storeId}/kiosk-settings`);
}

export function updateKioskSettings(
  storeId: string,
  body: Partial<ApiKioskSettings>
): Promise<ApiKioskSettings> {
  return apiPatch(`/stores/${storeId}/kiosk-settings`, body);
}
