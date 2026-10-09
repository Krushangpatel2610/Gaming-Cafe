import { apiGet, apiPatch, apiPost, apiDelete, apiPostFormData } from "./client";
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

export function uploadGameImage(storeId: string, gameId: string, file: File): Promise<{ game: ApiGame }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostFormData(`/stores/${storeId}/games/${gameId}/image`, formData);
}

export function installGame(storeId: string, systemId: string, gameId: string, executablePath?: string | null): Promise<unknown> {
  return apiPost(`/stores/${storeId}/games/install`, { systemId, gameId, isInstalled: true, executablePath });
}

export function uninstallGame(storeId: string, systemId: string, gameId: string): Promise<unknown> {
  return apiDelete(`/stores/${storeId}/games/uninstall?systemId=${systemId}&gameId=${gameId}`);
}

export interface GameSystemAssignment {
  systemId: string;
  executablePath: string | null;
}

export function getGameSystems(storeId: string, gameId: string): Promise<GameSystemAssignment[]> {
  return apiGet<GameSystemAssignment[]>(`/stores/${storeId}/games/${gameId}/systems`);
}

export interface StationGame {
  id: string;
  name: string;
  genre: string | null;
  executablePath: string | null;
  isInstalled: boolean;
  isActive: boolean;
}

export function listStationGames(storeId: string, systemId: string): Promise<StationGame[]> {
  return apiGet<StationGame[]>(`/stores/${storeId}/games/system/${systemId}`);
}

export function deleteGame(storeId: string, gameId: string): Promise<unknown> {
  return apiDelete(`/stores/${storeId}/games/${gameId}`);
}
