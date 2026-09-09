import { apiGet, apiGetPaginated, apiPost, ApiListResult } from "./client";
import { ApiCreditTransaction } from "./types";

export interface ApiBalance {
  currentBalance: string;
  availableBalance: string;
}

export function getBalance(storeId: string, userId: string): Promise<ApiBalance> {
  return apiGet<ApiBalance>(`/stores/${storeId}/credits/balance/${userId}`);
}

export function getMyCreditBalance(storeId: string): Promise<ApiBalance> {
  return apiGet<ApiBalance>(`/stores/${storeId}/credits/balance`);
}

export function getMyCreditTransactions(
  storeId: string,
  page = 1,
  limit = 20
): Promise<ApiListResult<ApiCreditTransaction[]>> {
  return apiGetPaginated<ApiCreditTransaction[]>(
    `/stores/${storeId}/credits/transactions?page=${page}&limit=${limit}`
  );
}

export interface RedeemCreditsBody {
  amount: number;
  billingId?: string;
  description?: string;
}

export function redeemCredits(
  storeId: string,
  body: RedeemCreditsBody
): Promise<{ transaction: ApiCreditTransaction; newBalance: ApiBalance }> {
  return apiPost(`/stores/${storeId}/credits/redeem`, body);
}

export interface AdjustCreditsBody {
  userId: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
}

export function adjustCredits(storeId: string, body: AdjustCreditsBody): Promise<unknown> {
  return apiPost(`/stores/${storeId}/credits/adjust`, body);
}

