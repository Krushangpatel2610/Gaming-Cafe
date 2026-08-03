import { apiGet, apiPost } from "./client";
import { ApiAdmin, ApiAdminLoginResponse } from "./types";

export function adminLogin(email: string, password: string): Promise<ApiAdminLoginResponse> {
  return apiPost<ApiAdminLoginResponse>("/auth/admin/login", { email, password });
}

export function adminLogout(refreshToken?: string, all?: boolean): Promise<void> {
  return apiPost<void>("/auth/admin/logout", { refreshToken, all });
}

export function getAdminMe(): Promise<ApiAdmin> {
  return apiGet<ApiAdmin>("/auth/admin/me");
}
