import { apiDelete, apiGetPaginated, apiPatch, apiPost } from "./client";
import { ApiStaff } from "./types";

function toQueryString(params?: object): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string | number | boolean][];
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`;
}

export interface ListStaffParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export async function listStaff(storeId: string, params?: ListStaffParams) {
  return apiGetPaginated<ApiStaff[]>(`/stores/${storeId}/staff${toQueryString(params)}`);
}

export interface CreateStaffBody {
  name: string;
  email: string;
  phone?: string | null;
  password: string;
}

export function createStaff(storeId: string, body: CreateStaffBody): Promise<{ staff: ApiStaff }> {
  return apiPost(`/stores/${storeId}/staff`, body);
}

export interface UpdateStaffBody {
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string;
  isActive?: boolean;
}

export function updateStaff(
  storeId: string,
  staffId: string,
  body: UpdateStaffBody
): Promise<{ staff: ApiStaff }> {
  return apiPatch(`/stores/${storeId}/staff/${staffId}`, body);
}

export function deleteStaff(storeId: string, staffId: string): Promise<{ id: string }> {
  return apiDelete(`/stores/${storeId}/staff/${staffId}`);
}
