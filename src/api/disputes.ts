import { apiGetPaginated, apiPost } from "./client";
import { ApiDispute, ApiDisputeResolution, ApiDisputeStatus } from "./types";

function toQueryString(params?: object): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string | number][];
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`;
}

export interface ListDisputesParams {
  page?: number;
  limit?: number;
  status?: ApiDisputeStatus;
}

export async function listDisputes(storeId: string, params?: ListDisputesParams) {
  return apiGetPaginated<ApiDispute[]>(`/stores/${storeId}/disputes${toQueryString(params)}`);
}

export function startDisputeReview(storeId: string, disputeId: string): Promise<{ dispute: ApiDispute }> {
  return apiPost(`/stores/${storeId}/disputes/${disputeId}/review`);
}

export interface ResolveDisputeBody {
  resolution: ApiDisputeResolution;
  resolutionAmount?: number;
  resolutionNotes?: string;
}

export function resolveDispute(
  storeId: string,
  disputeId: string,
  body: ResolveDisputeBody
): Promise<{ dispute: ApiDispute }> {
  return apiPost(`/stores/${storeId}/disputes/${disputeId}/resolve`, body);
}
