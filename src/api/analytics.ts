import { apiGet } from "./client";
import {
  ApiDashboardAnalytics,
  ApiPlayerAnalytics,
  ApiRevenueAnalytics,
  ApiSessionStatsAnalytics,
  ApiSystemPerformanceAnalytics,
  ApiUtilizationAnalytics,
} from "./types";

function toQueryString(params?: object): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string | number][];
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`;
}

export function getDashboardAnalytics(storeId: string, date?: string): Promise<ApiDashboardAnalytics> {
  return apiGet(`/stores/${storeId}/analytics/dashboard${toQueryString({ date })}`);
}

export interface DateRangeParams {
  dateFrom?: string;
  dateTo?: string;
}

export function getRevenueAnalytics(
  storeId: string,
  params?: DateRangeParams & { groupBy?: "day" | "week" | "month" }
): Promise<ApiRevenueAnalytics> {
  return apiGet(`/stores/${storeId}/analytics/revenue${toQueryString(params)}`);
}

export function getUtilizationAnalytics(storeId: string, params?: DateRangeParams): Promise<ApiUtilizationAnalytics> {
  return apiGet(`/stores/${storeId}/analytics/utilization${toQueryString(params)}`);
}

export function getSessionStatsAnalytics(
  storeId: string,
  params?: DateRangeParams
): Promise<ApiSessionStatsAnalytics> {
  return apiGet(`/stores/${storeId}/analytics/sessions/stats${toQueryString(params)}`);
}

export function getPlayerAnalytics(storeId: string, params?: DateRangeParams): Promise<ApiPlayerAnalytics> {
  return apiGet(`/stores/${storeId}/analytics/players${toQueryString(params)}`);
}

export function getSystemPerformanceAnalytics(
  storeId: string,
  params?: DateRangeParams
): Promise<ApiSystemPerformanceAnalytics> {
  return apiGet(`/stores/${storeId}/analytics/systems/performance${toQueryString(params)}`);
}
