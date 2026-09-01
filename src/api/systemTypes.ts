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

export function updateSystemTypeRate(storeId: string, systemTypeId: string, hourlyBaseRate: number): Promise<ApiSystemType> {
  return apiPatch<ApiSystemType>(`/stores/${storeId}/system-types/${systemTypeId}`, { hourlyBaseRate });
}
