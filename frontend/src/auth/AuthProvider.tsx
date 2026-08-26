import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authApi } from "../api/auth-api";
import {
  clearAccessToken,
  setAccessToken,
} from "./auth-token-store";
import type { AuthenticatedUser, AuthResponse, AuthStatus } from "./auth-types";

type AuthCredentials = Parameters<typeof authApi.login>[0];

type AuthContextValue = {
  user: AuthenticatedUser | null;
  status: AuthStatus;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (credentials: AuthCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

let sessionRestorePromise: Promise<AuthResponse> | null = null;

function restoreSession(): Promise<AuthResponse> {
  if (!sessionRestorePromise) {
    sessionRestorePromise = authApi.refresh().finally(() => {
      sessionRestorePromise = null;
    });
  }

  return sessionRestorePromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("restoring");

  const applySession = useCallback((response: AuthResponse) => {
    setAccessToken(response.accessToken);
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  const clearSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    let cancelled = false;

    void restoreSession()
      .then((response) => {
        if (!cancelled) {
          applySession(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async (credentials: AuthCredentials) => {
      const response = await authApi.login(credentials);
      applySession(response);
    },
    [applySession],
  );

  const register = useCallback(
    async (credentials: AuthCredentials) => {
      const response = await authApi.register(credentials);
      applySession(response);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      await queryClient.removeQueries({ queryKey: ["calendar-events"] });
    }
  }, [clearSession, queryClient]);

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [login, logout, register, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
