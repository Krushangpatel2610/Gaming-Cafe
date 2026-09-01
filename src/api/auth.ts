import { apiGet, apiPost } from "./client";
import { ApiAdmin, ApiAdminLoginResponse, ApiUser, ApiUserLoginResponse } from "./types";

export function adminLogin(email: string, password: string): Promise<ApiAdminLoginResponse> {
  return apiPost<ApiAdminLoginResponse>("/auth/admin/login", { email, password });
}

export function adminLogout(refreshToken?: string, all?: boolean): Promise<void> {
  return apiPost<void>("/auth/admin/logout", { refreshToken, all });
}

export function getAdminMe(): Promise<ApiAdmin> {
  return apiGet<ApiAdmin>("/auth/admin/me");
}

// Mails a 6-digit code (10 min expiry) — always resolves regardless of
// whether the email matches an account, by backend design (no email
// enumeration).
export function adminRequestPasswordReset(email: string): Promise<void> {
  return apiPost<void>("/auth/admin/password-reset/request", { email });
}

export function adminConfirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
  return apiPost<void>("/auth/admin/password-reset/confirm", { email, code, newPassword });
}

// ── Customer (player) account — used by the signup wizard's "Customer" path.
// This app has no customer-facing dashboard; these exist only to create the
// account and link it to a chosen store, not to hold a session here.

export function registerUser(body: { name: string; email: string; password: string; phone?: string }): Promise<{ user: ApiUser }> {
  return apiPost("/auth/register", body);
}

export function userLoginEmail(email: string, password: string): Promise<ApiUserLoginResponse> {
  return apiPost<ApiUserLoginResponse>("/auth/login/email", { email, password });
}
