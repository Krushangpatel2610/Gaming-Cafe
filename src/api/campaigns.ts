import { apiGet, apiGetPaginated, apiPatch, apiPost } from "./client";
import { ApiCampaign } from "./types";

export async function listCampaigns(storeId: string, params?: { page?: number; limit?: number; status?: string }) {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined) as [string, string | number][];
  const qs = entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}` : "";
  return apiGetPaginated<ApiCampaign[]>(`/stores/${storeId}/campaigns${qs}`);
}

export interface CreateCampaignBody {
  name: string;
  campaignType: "percentage_off" | "fixed_off" | "bonus_minutes" | "bonus_credits" | "happy_hour" | "first_visit";
  value: number;
  validFrom: string;
  validUntil: string;
  minTier?: number;
  maxRedemptions?: number;
  maxPerUser?: number;
  description?: string;
  terms?: string;
}

export function createCampaign(storeId: string, body: CreateCampaignBody): Promise<{ campaign: ApiCampaign }> {
  return apiPost(`/stores/${storeId}/campaigns`, body);
}

// The backend has no delete for campaigns — "removing" a promotion means
// cancelling it (status: cancelled) via the same update endpoint pause/
// resume also use, not a real DELETE.
export function cancelCampaign(storeId: string, campaignId: string): Promise<{ campaign: ApiCampaign }> {
  return apiPatch(`/stores/${storeId}/campaigns/${campaignId}`, { status: "cancelled" });
}

export function pauseCampaign(storeId: string, campaignId: string): Promise<{ campaign: ApiCampaign }> {
  return apiPost(`/stores/${storeId}/campaigns/${campaignId}/pause`);
}

export function resumeCampaign(storeId: string, campaignId: string): Promise<{ campaign: ApiCampaign }> {
  return apiPost(`/stores/${storeId}/campaigns/${campaignId}/resume`);
}
