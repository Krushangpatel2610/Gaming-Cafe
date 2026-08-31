import { apiPatch } from "./client";
import { ApiStore } from "./types";

export function updateStore(storeId: string, body: { name?: string }): Promise<ApiStore> {
  return apiPatch<ApiStore>(`/stores/${storeId}`, body);
}
