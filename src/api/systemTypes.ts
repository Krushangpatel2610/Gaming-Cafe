import { apiGet, apiPatch, apiPost } from "./client";
import { ApiSystemType } from "./types";

export interface CreateSystemTypeBody {
  name: string;
  hourlyBaseRate: number;
  description?: string;
}

export function createSystemType(storeId: string, body: CreateSystemTypeBody): Promise<{ systemType: ApiSystemType }> {
  return apiPost(`/stores/${storeId}/system-types`, body);
}

// Admin-facing: the live backend (main branch) puts the admin listing at
// "/all" — the player route below owns bare "/" on this branch (both are
// GET on the same store-scoped prefix, so they can't share a path — see
// the backend's system-types module for why).
export function listSystemTypes(storeId: string): Promise<ApiSystemType[]> {
  return apiGet<ApiSystemType[]>(`/stores/${storeId}/system-types/all`);
}

// Player-facing: owns bare "/" on the live backend.
export function listActiveSystemTypes(storeId: string): Promise<ApiSystemType[]> {
  return apiGet<ApiSystemType[]>(`/stores/${storeId}/system-types`);
}

export function updateSystemTypeRate(storeId: string, systemTypeId: string, hourlyBaseRate: number): Promise<ApiSystemType> {
  return apiPatch<ApiSystemType>(`/stores/${storeId}/system-types/${systemTypeId}`, { hourlyBaseRate });
}
