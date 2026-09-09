import { apiGet, apiGetPaginated, apiPost, ApiListResult } from "./client";
import { ApiSession } from "./types";

export interface ListSessionsParams {
  page?: number;
  limit?: number;
  status?: string;
  systemId?: string;
  date?: string;
}

function toQueryString(params?: ListSessionsParams): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string | number][];
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `?${search.toString()}`;
}

export function listSessions(storeId: string, params?: ListSessionsParams): Promise<ApiSession[]> {
  return apiGet<ApiSession[]>(`/stores/${storeId}/sessions${toQueryString(params)}`);
}

export function listActiveSessions(storeId: string): Promise<ApiSession[]> {
  return apiGet<ApiSession[]>(`/stores/${storeId}/sessions/active`);
}

export function getMySessions(storeId: string, page = 1, limit = 20): Promise<ApiListResult<ApiSession[]>> {
  return apiGetPaginated<ApiSession[]>(`/stores/${storeId}/sessions/my?page=${page}&limit=${limit}`);
}

export interface StartManualSessionBody {
  systemId: string;
  userId?: string;
  walkInPhone?: string;
  notes?: string;
}

export function startManualSession(storeId: string, body: StartManualSessionBody): Promise<ApiSession> {
  return apiPost<ApiSession>(`/stores/${storeId}/sessions`, body);
}

export function endSession(storeId: string, sessionId: string, endedAt?: string): Promise<ApiSession> {
  return apiPost<ApiSession>(`/stores/${storeId}/sessions/${sessionId}/end`, endedAt ? { endedAt } : undefined);
}

export function extendSession(storeId: string, sessionId: string, additionalMinutes: number): Promise<ApiSession> {
  return apiPost<ApiSession>(`/stores/${storeId}/sessions/${sessionId}/extend`, { additionalMinutes });
}

export function qrLogin(storeId: string, token: string): Promise<{ session: ApiSession }> {
  return apiPost(`/stores/${storeId}/sessions/qr-login`, { token });
}

export function stationLogin(storeId: string, systemId: string): Promise<{ session: ApiSession }> {
  return apiPost(`/stores/${storeId}/sessions/login`, { systemId });
}

