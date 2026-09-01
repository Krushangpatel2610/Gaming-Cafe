import { apiGet } from "./client";
import { ApiUser, ApiUserDashboard } from "./types";

export function getUserProfile(): Promise<ApiUser> {
  return apiGet<ApiUser>("/users/profile");
}

export function getUserDashboard(storeId: string): Promise<ApiUserDashboard> {
  return apiGet<ApiUserDashboard>(`/users/stores/${storeId}/dashboard`);
}
