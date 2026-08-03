import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { adminLogin, adminLogout, getAdminMe } from "../api/auth";
import { getStoredToken, setStoredToken, setUnauthorizedHandler, ApiError } from "../api/client";
import { ApiAdmin } from "../api/types";

const REFRESH_TOKEN_KEY = "gc_admin_refresh_token";

interface AuthContextValue {
  admin: ApiAdmin | null;
  storeId: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<ApiAdmin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearSession = useCallback(() => {
    setStoredToken(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAdmin(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    getAdminMe()
      .then(setAdmin)
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const result = await adminLogin(email, password);
      setStoredToken(result.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
      setAdmin(result.admin);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to sign in.";
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || undefined;
    adminLogout(refreshToken).catch(() => {
      // Best-effort: even if the server call fails, clear the local session.
    });
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{ admin, storeId: admin?.storeId ?? null, isLoading, error, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
