import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import { ApiAvailableSystem, ApiSystem, ApiSystemPlatform, ApiSystemSpecs, ApiSystemStatus } from "./types";

export function listAvailableSystems(storeId: string): Promise<ApiAvailableSystem[]> {
  return apiGet<ApiAvailableSystem[]>(`/stores/${storeId}/systems/available`);
}

export function listSystems(storeId: string): Promise<ApiSystem[]> {
  return apiGet<ApiSystem[]>(`/stores/${storeId}/systems`);
}

export function listLiveSystems(storeId: string): Promise<ApiSystem[]> {
  return apiGet<ApiSystem[]>(`/stores/${storeId}/systems/live`);
}

export interface CreateSystemBody {
  name: string;
  stationNumber: number;
  platform?: ApiSystemPlatform;
  systemTypeId?: string;
  ipAddress?: string;
  macAddress?: string;
  specs?: ApiSystemSpecs;
}

export function createSystem(
  storeId: string,
  body: CreateSystemBody
): Promise<{ system: ApiSystem; apiKey: string }> {
  return apiPost(`/stores/${storeId}/systems`, body);
}

export interface UpdateSystemBody {
  name?: string;
  stationNumber?: string;
  platform?: ApiSystemPlatform;
  systemTypeId?: string;
  ipAddress?: string;
  macAddress?: string;
  specs?: ApiSystemSpecs;
  status?: ApiSystemStatus;
}

export function updateSystem(storeId: string, systemId: string, body: UpdateSystemBody): Promise<ApiSystem> {
  return apiPatch<ApiSystem>(`/stores/${storeId}/systems/${systemId}`, body);
}

export function deactivateSystem(storeId: string, systemId: string): Promise<null> {
  return apiDelete(`/stores/${storeId}/systems/${systemId}`);
}

export function regenerateSystemKey(storeId: string, systemId: string): Promise<{ apiKey: string }> {
  return apiPost(`/stores/${storeId}/systems/${systemId}/regenerate-key`);
}

export interface LockCommandResult {
  commandSent: boolean;
  agentOnline: boolean;
}

export function lockSystem(storeId: string, systemId: string): Promise<LockCommandResult> {
  return apiPost<LockCommandResult>(`/stores/${storeId}/systems/${systemId}/lock`);
}

export function unlockSystem(storeId: string, systemId: string): Promise<LockCommandResult> {
  return apiPost<LockCommandResult>(`/stores/${storeId}/systems/${systemId}/unlock`);
}
