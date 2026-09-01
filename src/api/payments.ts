import { apiGet, apiGetPaginated, apiPost } from "./client";
import { ApiPayment, ApiPaymentDetail, ApiPaymentMethod, ApiPaymentStatus, ApiReconciliationRow } from "./types";

function toQueryString(params?: object): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string | number][];
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`;
}

export interface RecordPaymentBody {
  billingId?: string;
  userId?: string;
  amount: number;
  method: ApiPaymentMethod;
  transactionRef?: string;
  idempotencyKey?: string;
  notes?: string;
}

export function recordPayment(storeId: string, body: RecordPaymentBody): Promise<{ payment: ApiPayment }> {
  return apiPost(`/stores/${storeId}/payments`, body);
}

export function refundPayment(
  storeId: string,
  paymentId: string,
  body: { amount?: number; reason: string }
): Promise<{ payment: ApiPayment }> {
  return apiPost(`/stores/${storeId}/payments/${paymentId}/refund`, body);
}

export interface ListPaymentsParams {
  page?: number;
  limit?: number;
  status?: ApiPaymentStatus;
  method?: ApiPaymentMethod;
  billingId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listPayments(storeId: string, params?: ListPaymentsParams) {
  return apiGetPaginated<ApiPayment[]>(`/stores/${storeId}/payments${toQueryString(params)}`);
}

export function getPaymentDetail(storeId: string, paymentId: string): Promise<{ payment: ApiPaymentDetail }> {
  return apiGet(`/stores/${storeId}/payments/${paymentId}`);
}

export function getReconciliation(
  storeId: string,
  params?: { dateFrom?: string; dateTo?: string }
): Promise<{ report: ApiReconciliationRow[]; dateFrom: string | null; dateTo: string | null }> {
  return apiGet(`/stores/${storeId}/payments/reconciliation${toQueryString(params)}`);
}
