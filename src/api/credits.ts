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

// ── Wallet top-up requests (player-initiated, staff-confirmed) ──────────

export type TopupRequestStatus = "pending" | "confirmed" | "rejected";

export interface ApiTopupRequest {
  id: string;
  storeId: string;
  userId: string;
  amount: string;
  utrReference: string | null;
  status: TopupRequestStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ApiPaymentInfo {
  upiQrImage: string | null;
  upiId: string | null;
}

export function getPaymentInfo(storeId: string): Promise<ApiPaymentInfo> {
  return apiGet<ApiPaymentInfo>(`/stores/${storeId}/payment-info`);
}

export function requestTopup(
  storeId: string,
  body: { amount: number; utrReference?: string }
): Promise<ApiTopupRequest> {
  return apiPost<ApiTopupRequest>(`/stores/${storeId}/credits/topup-requests`, body);
}

export function getMyTopupRequests(
  storeId: string,
  page = 1,
  limit = 20
): Promise<ApiListResult<ApiTopupRequest[]>> {
  return apiGetPaginated<ApiTopupRequest[]>(
    `/stores/${storeId}/credits/topup-requests/my?page=${page}&limit=${limit}`
  );
}

// ── Admin: review top-up requests ────────────────────────────────────────

export function listTopupRequests(
  storeId: string,
  params?: { status?: TopupRequestStatus; page?: number; limit?: number }
): Promise<ApiListResult<ApiTopupRequest[]>> {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined) as [string, string | number][];
  const qs = entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}` : "";
  return apiGetPaginated<ApiTopupRequest[]>(`/stores/${storeId}/credits/topup-requests${qs}`);
}

export function confirmTopupRequest(storeId: string, requestId: string): Promise<ApiTopupRequest> {
  return apiPost<ApiTopupRequest>(`/stores/${storeId}/credits/topup-requests/${requestId}/confirm`);
}

export function rejectTopupRequest(
  storeId: string,
  requestId: string,
  reason: string
): Promise<ApiTopupRequest> {
  return apiPost<ApiTopupRequest>(`/stores/${storeId}/credits/topup-requests/${requestId}/reject`, { reason });
}

