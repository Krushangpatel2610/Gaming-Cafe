import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { adminLogin, adminLogout, getAdminMe } from "../api/auth";
import { userLoginEmail } from "../api/auth";
import { getUserProfile } from "../api/user";
import { getStoredToken, setStoredToken, setUnauthorizedHandler, setRememberMe, getAuthStorage, ApiError } from "../api/client";
import { ApiAdmin, ApiAdminLoginResponse, ApiUser } from "../api/types";

const ADMIN_REFRESH_KEY = "gc_admin_refresh_token";
const USER_REFRESH_KEY = "gc_user_refresh_token";
const USER_STORE_KEY = "gc_user_store_id";
const SESSION_TYPE_KEY = "gc_session_type";

interface AuthContextValue {
  // Admin session
  admin: ApiAdmin | null;
  storeId: string | null;
  // User session
  user: ApiUser | null;
  userStoreId: string | null;

  isLoading: boolean;
  error: string | null;

  // Admin auth
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  applySession: (result: ApiAdminLoginResponse, rememberMe?: boolean) => void;

  // User auth
  userLogin: (email: string, password: string, storeId: string, rememberMe?: boolean) => Promise<void>;
  userLogout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<ApiAdmin | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [userStoreId, setUserStoreIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearAdminSession = useCallback(() => {
    setStoredToken(null);
    // Clear from both storages -- the active one may have changed since
    // login if the remember-me choice was different last time.
    localStorage.removeItem(ADMIN_REFRESH_KEY);
    sessionStorage.removeItem(ADMIN_REFRESH_KEY);
    localStorage.removeItem(SESSION_TYPE_KEY);
    setAdmin(null);
  }, []);

  const clearUserSession = useCallback(() => {
    setStoredToken(null);
    localStorage.removeItem(USER_REFRESH_KEY);
    sessionStorage.removeItem(USER_REFRESH_KEY);
    localStorage.removeItem(USER_STORE_KEY);
    sessionStorage.removeItem(USER_STORE_KEY);
    localStorage.removeItem(SESSION_TYPE_KEY);
    setUser(null);
    setUserStoreIdState(null);
  }, []);

  const clearActiveSession = useCallback(() => {
    const sessionType = localStorage.getItem(SESSION_TYPE_KEY);
    if (sessionType === "user") {
      clearUserSession();
    } else {
      clearAdminSession();
    }
  }, [clearAdminSession, clearUserSession]);

  useEffect(() => {
    setUnauthorizedHandler(clearActiveSession);
    return () => setUnauthorizedHandler(null);
  }, [clearActiveSession]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    const sessionType = localStorage.getItem(SESSION_TYPE_KEY);

    if (sessionType === "user") {
      const storedStoreId = getAuthStorage().getItem(USER_STORE_KEY);
      getUserProfile()
        .then((u) => {
          setUser(u);
          setUserStoreIdState(storedStoreId);
        })
        .catch(() => clearUserSession())
        .finally(() => setIsLoading(false));
    } else {
      getAdminMe()
        .then(setAdmin)
        .catch(() => clearAdminSession())
        .finally(() => setIsLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applySession = useCallback((result: ApiAdminLoginResponse, rememberMe = true) => {
    clearUserSession();
    setRememberMe(rememberMe);
    setStoredToken(result.accessToken);
    getAuthStorage().setItem(ADMIN_REFRESH_KEY, result.refreshToken);
    localStorage.setItem(SESSION_TYPE_KEY, "admin");
    setAdmin(result.admin);
    setUser(null);
  }, [clearUserSession]);

  const login = useCallback(async (email: string, password: string, rememberMe = true) => {
    setError(null);
    try {
      const result = await adminLogin(email, password, rememberMe);
      applySession(result, rememberMe);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to sign in.";
      setError(message);
      throw err;
    }
  }, [applySession]);

  const logout = useCallback(() => {
    const refreshToken = getAuthStorage().getItem(ADMIN_REFRESH_KEY) || undefined;
    adminLogout(refreshToken).catch(() => {});
    clearAdminSession();
  }, [clearAdminSession]);

  const userLogin = useCallback(async (email: string, password: string, storeId: string, rememberMe = true) => {
    setError(null);
    try {
      const result = await userLoginEmail(email, password, rememberMe);
      clearAdminSession();
      setRememberMe(rememberMe);
      setStoredToken(result.accessToken);
      const storage = getAuthStorage();
      storage.setItem(USER_REFRESH_KEY, result.refreshToken);
      storage.setItem(USER_STORE_KEY, storeId);
      localStorage.setItem(SESSION_TYPE_KEY, "user");
      setUser(result.user);
      setUserStoreIdState(storeId);
      setAdmin(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to sign in.";
      setError(message);
      throw err;
    }
  }, [clearAdminSession]);

  const userLogout = useCallback(() => {
    clearUserSession();
  }, [clearUserSession]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        storeId: admin?.storeId ?? null,
        user,
        userStoreId,
        isLoading,
        error,
        login,
        logout,
        applySession,
        userLogin,
        userLogout,
      }}
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
