import { apiGet, apiPatch, apiPost, apiDelete } from "./client";
import { ApiApp } from "./types";

export function listApps(storeId: string): Promise<ApiApp[]> {
  return apiGet<ApiApp[]>(`/stores/${storeId}/apps`);
}

export interface CreateAppBody {
  name: string;
  category: string;
  executablePath: string;
  launchArgs?: string;
}

export function createApp(storeId: string, body: CreateAppBody): Promise<ApiApp> {
  return apiPost<ApiApp>(`/stores/${storeId}/apps`, body);
}

export interface UpdateAppBody {
  name?: string;
  category?: string;
  executablePath?: string;
  launchArgs?: string;
  isActive?: boolean;
}

export function updateApp(storeId: string, appId: string, body: UpdateAppBody): Promise<ApiApp> {
  return apiPatch<ApiApp>(`/stores/${storeId}/apps/${appId}`, body);
}

export function installApp(storeId: string, systemId: string, appId: string): Promise<unknown> {
  return apiPost(`/stores/${storeId}/apps/install`, { systemId, appId, isInstalled: true });
}

export function uninstallApp(storeId: string, systemId: string, appId: string): Promise<unknown> {
  return apiDelete(`/stores/${storeId}/apps/uninstall?systemId=${systemId}&appId=${appId}`);
}

export function getAppSystems(storeId: string, appId: string): Promise<string[]> {
  return apiGet<string[]>(`/stores/${storeId}/apps/${appId}/systems`);
}

export function deleteApp(storeId: string, appId: string): Promise<unknown> {
  return apiDelete(`/stores/${storeId}/apps/${appId}`);
}
