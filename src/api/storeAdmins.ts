import { apiDelete, apiGetPaginated, apiPatch, apiPost } from "./client";
import { ApiStoreAdmin, ApiStoreAdminRole } from "./types";

function toQueryString(params?: object): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string | number | boolean][];
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`;
}

export interface ListStoreAdminsParams {
  page?: number;
  limit?: number;
  role?: ApiStoreAdminRole;
  isActive?: boolean;
}

export async function listStoreAdmins(storeId: string, params?: ListStoreAdminsParams) {
  return apiGetPaginated<ApiStoreAdmin[]>(`/stores/${storeId}/admins${toQueryString(params)}`);
}

export interface CreateStoreAdminBody {
  name: string;
  email: string;
  password: string;
  role: "admin" | "staff";
  permissions?: Record<string, boolean>;
}

export function createStoreAdmin(storeId: string, body: CreateStoreAdminBody): Promise<{ admin: ApiStoreAdmin }> {
  return apiPost(`/stores/${storeId}/admins`, body);
}

export interface UpdateStoreAdminBody {
  name?: string;
  role?: "admin" | "staff";
  permissions?: Record<string, boolean>;
}

export function updateStoreAdmin(
  storeId: string,
  adminId: string,
  body: UpdateStoreAdminBody
): Promise<{ admin: ApiStoreAdmin }> {
  return apiPatch(`/stores/${storeId}/admins/${adminId}`, body);
}

export function deactivateStoreAdmin(storeId: string, adminId: string): Promise<null> {
  return apiDelete(`/stores/${storeId}/admins/${adminId}`);
}
