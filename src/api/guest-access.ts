import { apiGetPaginated, apiPost, ApiListResult } from "./client";

export type GuestAccessStatus = "pending" | "redeemed" | "expired";

export interface ApiGuestAccessRequest {
  id: string;
  storeId: string;
  systemId: string;
  systemName: string;
  code: string;
  requestedByAdminId: string | null;
  adminName: string | null;
  adminEmail: string | null;
  status: GuestAccessStatus;
  sessionId: string | null;
  expiresAt: string;
  redeemedAt: string | null;
  createdAt: string;
}

export interface GenerateGuestOtpResponse {
  code: string;
  systemId: string;
  systemName: string;
  expiresInSeconds: number;
  expiresAt: string;
}

export interface ListGuestRequestsParams {
  page?: number;
  limit?: number;
  status?: GuestAccessStatus;
  systemId?: string;
}

export function generateGuestOtp(
  storeId: string,
  systemId: string
): Promise<GenerateGuestOtpResponse> {
  return apiPost<GenerateGuestOtpResponse>(
    `/stores/${storeId}/guest-access/systems/${systemId}/request`
  );
}

export function listGuestAccessRequests(
  storeId: string,
  params: ListGuestRequestsParams = {}
): Promise<ApiListResult<ApiGuestAccessRequest[]>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.systemId) query.set("systemId", params.systemId);

  const qs = query.toString();
  return apiGetPaginated<ApiGuestAccessRequest[]>(
    `/stores/${storeId}/guest-access/requests${qs ? `?${qs}` : ""}`
  );
}
