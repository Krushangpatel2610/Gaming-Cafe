import { apiGet, apiGetPaginated, apiPost } from "./client";
import { ApiBillingEntry, ApiBillingOverride, ApiBillingRevenueSummary } from "./types";

function toQueryString(params?: object): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string | number][];
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`;
}

export interface ListLedgerParams {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  sessionId?: string;
}

export async function listBillingLedger(storeId: string, params?: ListLedgerParams) {
  return apiGetPaginated<ApiBillingEntry[]>(`/stores/${storeId}/billing/ledger${toQueryString(params)}`);
}

export function getBillingDetail(
  storeId: string,
  billingId: string
): Promise<{ billing: ApiBillingEntry; overrides: ApiBillingOverride[] }> {
  return apiGet(`/stores/${storeId}/billing/ledger/${billingId}`);
}

export function generateBill(storeId: string, sessionId: string): Promise<{ billing: ApiBillingEntry }> {
  return apiPost(`/stores/${storeId}/billing/${sessionId}/bill`);
}

export interface OverrideBody {
  overrideType: "price" | "duration" | "both";
  reason: string;
  newAmount?: number;
  newMinutes?: number;
}

export function applyBillingOverride(
  storeId: string,
  billingId: string,
  body: OverrideBody
): Promise<{ billing: ApiBillingEntry; override: ApiBillingOverride }> {
  return apiPost(`/stores/${storeId}/billing/ledger/${billingId}/override`, body);
}

export function getRevenueSummary(
  storeId: string,
  params?: { dateFrom?: string; dateTo?: string; groupBy?: "day" | "hour" }
): Promise<ApiBillingRevenueSummary> {
  return apiGet(`/stores/${storeId}/billing/revenue/summary${toQueryString(params)}`);
}
