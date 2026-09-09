import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost, apiPut, ApiListResult } from "./client";
import { ApiLoyaltyReward, ApiLoyaltySettings, ApiLoyaltyTransaction } from "./types";

// ── Player ──────────────────────────────────────────────────────────────

export function getMyLoyaltyBalance(storeId: string): Promise<{ balance: number }> {
  return apiGet<{ balance: number }>(`/stores/${storeId}/loyalty/balance`);
}

export function getMyLoyaltyTransactions(
  storeId: string,
  page = 1,
  limit = 20,
): Promise<ApiListResult<ApiLoyaltyTransaction[]>> {
  return apiGetPaginated<ApiLoyaltyTransaction[]>(
    `/stores/${storeId}/loyalty/transactions?page=${page}&limit=${limit}`,
  );
}

export function listLoyaltyRewards(storeId: string): Promise<ApiLoyaltyReward[]> {
  return apiGet<ApiLoyaltyReward[]>(`/stores/${storeId}/loyalty/rewards`);
}

export function redeemLoyaltyReward(
  storeId: string,
  rewardId: string,
): Promise<{ transaction: ApiLoyaltyTransaction; newBalance: number }> {
  return apiPost(`/stores/${storeId}/loyalty/rewards/${rewardId}/redeem`);
}

// ── Admin ───────────────────────────────────────────────────────────────

export function getLoyaltySettings(storeId: string): Promise<ApiLoyaltySettings> {
  return apiGet<ApiLoyaltySettings>(`/stores/${storeId}/loyalty/settings`);
}

export function updateLoyaltySettings(
  storeId: string,
  body: { pointsPerHour: number; isActive?: boolean },
): Promise<ApiLoyaltySettings> {
  return apiPut<ApiLoyaltySettings>(`/stores/${storeId}/loyalty/settings`, body);
}

export function listLoyaltyRewardsAdmin(storeId: string): Promise<ApiLoyaltyReward[]> {
  return apiGet<ApiLoyaltyReward[]>(`/stores/${storeId}/loyalty/rewards`);
}

export interface CreateLoyaltyRewardBody {
  name: string;
  description?: string;
  pointsCost: number;
  stock?: number;
}

export function createLoyaltyReward(
  storeId: string,
  body: CreateLoyaltyRewardBody,
): Promise<ApiLoyaltyReward> {
  return apiPost<ApiLoyaltyReward>(`/stores/${storeId}/loyalty/rewards`, body);
}

export function updateLoyaltyReward(
  storeId: string,
  rewardId: string,
  body: Partial<CreateLoyaltyRewardBody & { isActive: boolean }>,
): Promise<ApiLoyaltyReward> {
  return apiPatch<ApiLoyaltyReward>(`/stores/${storeId}/loyalty/rewards/${rewardId}`, body);
}

export function deleteLoyaltyReward(storeId: string, rewardId: string): Promise<unknown> {
  return apiDelete(`/stores/${storeId}/loyalty/rewards/${rewardId}`);
}

export function getUserLoyaltyBalance(
  storeId: string,
  userId: string,
): Promise<{ balance: number; userId: string }> {
  return apiGet(`/stores/${storeId}/loyalty/balance/${userId}`);
}

export interface AdjustLoyaltyPointsBody {
  userId: string;
  points: number;
  type: "credit" | "debit";
  description: string;
}

export function adjustLoyaltyPoints(storeId: string, body: AdjustLoyaltyPointsBody): Promise<unknown> {
  return apiPost(`/stores/${storeId}/loyalty/adjust`, body);
}
