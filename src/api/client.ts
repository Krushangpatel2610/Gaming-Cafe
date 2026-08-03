const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const TOKEN_KEY = "gc_admin_token";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: { total: number; page: number; limit: number; totalPages: number };
  error?: { code: string; message: string; details?: unknown };
}

export interface ApiListResult<T> {
  data: T;
  meta?: ApiEnvelope<T>["meta"];
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<ApiListResult<T>> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string> | undefined) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection or API base URL.", "NETWORK_ERROR", 0);
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok || !body || body.success === false) {
    const code = body?.error?.code || "UNKNOWN_ERROR";
    const message = body?.error?.message || response.statusText || "Request failed";
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    throw new ApiError(message, code, response.status, body?.error?.details);
  }

  return { data: body.data as T, meta: body.meta };
}

export async function apiGet<T>(path: string): Promise<T> {
  return (await apiRequest<T>(path, { method: "GET" })).data;
}

export async function apiGetPaginated<T>(path: string): Promise<ApiListResult<T>> {
  return apiRequest<T>(path, { method: "GET" });
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return (
    await apiRequest<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  ).data;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return (
    await apiRequest<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  ).data;
}

export async function apiDelete<T>(path: string): Promise<T> {
  return (await apiRequest<T>(path, { method: "DELETE" })).data;
}
