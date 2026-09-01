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

// Self-service — called by a signed-up user (not an admin) to join a
// store's customer directory, e.g. right after picking their gaming zone
// during signup. Requires the user's own token to already be set.
export function joinStoreAsCustomer(storeId: string): Promise<ApiCustomer> {
  return apiPost<ApiCustomer>(`/stores/${storeId}/customers/join`);
}

// Public — the whole "I'm a customer" signup path in one call: creates the
// login and links it to the chosen store's customer directory. No token
// needed before or after; this app has no customer session to hold.
export interface CustomerSignupBody {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export function signupAsCustomer(storeId: string, body: CustomerSignupBody): Promise<ApiCustomer> {
  return apiPost<ApiCustomer>(`/stores/${storeId}/customers/signup`, body);
}
