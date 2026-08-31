import { apiGet, apiPost } from "./client";

export interface ApiBalance {
  currentBalance: string;
  availableBalance: string;
}

export function getBalance(storeId: string, userId: string): Promise<ApiBalance> {
  return apiGet<ApiBalance>(`/stores/${storeId}/credits/balance/${userId}`);
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
