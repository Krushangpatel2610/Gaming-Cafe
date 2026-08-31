import { apiGet, apiPatch, apiPost, apiDelete } from "./client";
import { ApiGame } from "./types";

export function listGames(storeId: string): Promise<ApiGame[]> {
  return apiGet<ApiGame[]>(`/stores/${storeId}/games`);
}

export interface CreateGameBody {
  name: string;
  genre?: string;
  executablePath?: string;
}

export function createGame(storeId: string, body: CreateGameBody): Promise<ApiGame> {
  return apiPost<ApiGame>(`/stores/${storeId}/games`, body);
}

export interface UpdateGameBody {
  name?: string;
  genre?: string;
  executablePath?: string;
  isActive?: boolean;
}

export function updateGame(storeId: string, gameId: string, body: UpdateGameBody): Promise<ApiGame> {
  return apiPatch<ApiGame>(`/stores/${storeId}/games/${gameId}`, body);
}

export function installGame(storeId: string, systemId: string, gameId: string): Promise<unknown> {
  return apiPost(`/stores/${storeId}/games/install`, { systemId, gameId, isInstalled: true });
}

export function uninstallGame(storeId: string, systemId: string, gameId: string): Promise<unknown> {
  return apiDelete(`/stores/${storeId}/games/uninstall?systemId=${systemId}&gameId=${gameId}`);
}
