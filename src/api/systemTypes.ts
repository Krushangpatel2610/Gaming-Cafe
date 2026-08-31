import { apiGet, apiPatch } from "./client";
import { ApiSystemType } from "./types";

export function listSystemTypes(storeId: string): Promise<ApiSystemType[]> {
  return apiGet<ApiSystemType[]>(`/stores/${storeId}/system-types`);
}

export function updateSystemTypeRate(storeId: string, systemTypeId: string, hourlyBaseRate: number): Promise<ApiSystemType> {
  return apiPatch<ApiSystemType>(`/stores/${storeId}/system-types/${systemTypeId}`, { hourlyBaseRate });
}
