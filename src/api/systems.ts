import { apiGet, apiPatch, apiPost } from "./client";
import { ApiSystem, ApiSystemPlatform, ApiSystemSpecs, ApiSystemStatus } from "./types";

export function listSystems(storeId: string): Promise<ApiSystem[]> {
  return apiGet<ApiSystem[]>(`/stores/${storeId}/systems`);
}

export function listLiveSystems(storeId: string): Promise<ApiSystem[]> {
  return apiGet<ApiSystem[]>(`/stores/${storeId}/systems/live`);
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
