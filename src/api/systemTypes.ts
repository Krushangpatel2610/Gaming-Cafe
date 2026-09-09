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

export function listSystemTypes(storeId: string): Promise<ApiSystemType[]> {
  return apiGet<ApiSystemType[]>(`/stores/${storeId}/system-types`);
}

// Player-facing: active-only, hits a distinct sub-path from the admin route
// above (both are GET on the same store-scoped prefix, so they can't share
// a bare "/" — see the backend's system-types module for why).
export function listActiveSystemTypes(storeId: string): Promise<ApiSystemType[]> {
  return apiGet<ApiSystemType[]>(`/stores/${storeId}/system-types/active`);
}

export function updateSystemTypeRate(storeId: string, systemTypeId: string, hourlyBaseRate: number): Promise<ApiSystemType> {
  return apiPatch<ApiSystemType>(`/stores/${storeId}/system-types/${systemTypeId}`, { hourlyBaseRate });
}
