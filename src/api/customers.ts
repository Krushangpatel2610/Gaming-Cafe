import { apiGet, apiGetPaginated, apiPost } from "./client";
import { ApiCustomer } from "./types";

export interface ListCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  suspended?: boolean;
}

function toQueryString(params?: ListCustomersParams): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string | number | boolean][];
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `?${search.toString()}`;
}

export async function listCustomers(storeId: string, params?: ListCustomersParams) {
  return apiGetPaginated<ApiCustomer[]>(`/stores/${storeId}/customers${toQueryString(params)}`);
}

export function getCustomer(storeId: string, userId: string): Promise<ApiCustomer> {
  return apiGet<ApiCustomer>(`/stores/${storeId}/customers/${userId}`);
}

export interface RegisterCustomerBody {
  name: string;
  phone?: string;
}

export function registerCustomer(storeId: string, body: RegisterCustomerBody): Promise<ApiCustomer> {
  return apiPost<ApiCustomer>(`/stores/${storeId}/customers`, body);
}

export function suspendCustomer(storeId: string, userId: string, reason?: string): Promise<ApiCustomer> {
  return apiPost<ApiCustomer>(`/stores/${storeId}/customers/${userId}/suspend`, { reason });
}

export function activateCustomer(storeId: string, userId: string): Promise<ApiCustomer> {
  return apiPost<ApiCustomer>(`/stores/${storeId}/customers/${userId}/activate`);
}
