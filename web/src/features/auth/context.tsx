import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { configureHttpClient } from "../../lib/http";
import { clearToken, readToken, writeToken } from "./storage";
import { me as meApi } from "./api";
import type { AuthState, User } from "./types";

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  setSession: (token: string, user: User) => void;
  clearSession: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null, hydrated: false });

  const clearSession = useCallback(() => {
    clearToken();
    setState((prev) => ({ ...prev, token: null, user: null, hydrated: true }));
  }, []);

  const setSession = useCallback((token: string, user: User) => {
    writeToken(token);
    setState({ token, user, hydrated: true });
  }, []);

  const refreshMe = useCallback(async () => {
    const user = await meApi();
    setState((prev) => ({ ...prev, user }));
  }, []);

  useEffect(() => {
    configureHttpClient({
      getToken: () => state.token,
      onUnauthorized: () => {
        clearSession();
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }
    });
  }, [clearSession, state.token]);

  useEffect(() => {
    const boot = async () => {
      const token = readToken();
      if (!token) {
        setState({ token: null, user: null, hydrated: true });
        return;
      }

      setState({ token, user: null, hydrated: false });
      try {
        const user = await meApi();
        setState({ token, user, hydrated: true });
      } catch {
        clearToken();
        setState({ token: null, user: null, hydrated: true });
      }
    };

    void boot();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.token && state.user),
      setSession,
      clearSession,
      refreshMe
    }),
    [clearSession, refreshMe, setSession, state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
