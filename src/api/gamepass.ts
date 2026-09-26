import { apiGet, apiPatch, apiPost, apiDelete } from "./client";

export interface ApiGamepassPackage {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  validityDays: number;
  applicableSystemTypeIds: string[];
  dayOfWeek: number[];
  startTime: string;
  endTime: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function listPackages(storeId: string): Promise<ApiGamepassPackage[]> {
  return apiGet<ApiGamepassPackage[]>(`/stores/${storeId}/gamepass/packages/all`);
}

export interface CreatePackageBody {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  validityDays?: number;
  applicableSystemTypeIds?: string[];
  dayOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  sortOrder?: number;
}

export function createPackage(storeId: string, body: CreatePackageBody): Promise<{ package: ApiGamepassPackage }> {
  return apiPost<{ package: ApiGamepassPackage }>(`/stores/${storeId}/gamepass/packages`, body);
}

export interface UpdatePackageBody {
  name?: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  validityDays?: number;
  applicableSystemTypeIds?: string[];
  dayOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export function updatePackage(storeId: string, packageId: string, body: UpdatePackageBody): Promise<{ package: ApiGamepassPackage }> {
  return apiPatch<{ package: ApiGamepassPackage }>(`/stores/${storeId}/gamepass/packages/${packageId}`, body);
}

export function deletePackage(storeId: string, packageId: string): Promise<unknown> {
  return apiDelete(`/stores/${storeId}/gamepass/packages/${packageId}`);
}

export function assignPackageToSystem(storeId: string, packageId: string, systemId: string): Promise<unknown> {
  return apiPost(`/stores/${storeId}/gamepass/packages/${packageId}/assign`, { systemId });
}

export function unassignPackageFromSystem(storeId: string, packageId: string, systemId: string): Promise<unknown> {
  return apiDelete(`/stores/${storeId}/gamepass/packages/${packageId}/assign?systemId=${systemId}`);
}

export function getPackageSystems(storeId: string, packageId: string): Promise<string[]> {
  return apiGet<string[]>(`/stores/${storeId}/gamepass/packages/${packageId}/systems`);
}
