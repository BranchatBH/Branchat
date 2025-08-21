import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  API_ORIGIN,
  ensureAccessToken,
  clearLocalAuth,
} from "@/utils/auth";

export type AuthUser = {
  id: string;
  name?: string;
  profileImageUrl?: string;
} | null;

type AuthContextValue = {
  authUser: AuthUser;
  setAuthUser: React.Dispatch<React.SetStateAction<AuthUser>>;
  loading: boolean;
  error: string | null;
  apiFetch: (path: string, init?: RequestInit) => Promise<Response>;
  getMe : () => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthContextProvider");
  return ctx;
};

type Props = { children: ReactNode };

export const AuthContextProvider: React.FC<Props> = ({ children }) => {
  const [authUser, setAuthUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {});
    try {
      const at = await ensureAccessToken();
      if (at) headers.set("Authorization", `Bearer ${at}`);
    } catch {
    }

    let res = await fetch(API_ORIGIN + path, { ...init, headers });

    if (res.status === 401) {
      try {
        const at = await ensureAccessToken();
        headers.set("Authorization", `Bearer ${at}`);
        res = await fetch(API_ORIGIN + path, { ...init, headers });
      } catch {
        // give up + clear local tokens
        await clearLocalAuth();
      }
    }
    return res;
  }, []);

  const getMe = useCallback(async (): Promise<AuthUser> => {
    try {
      const r = await apiFetch("/auth/users");
      return r.ok ? ((await r.json()) as AuthUser) : null;
    } catch {
      return null;
    }
  }, [apiFetch]);

  // Hydrate user on mount (if refresh token exists)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      const me = await getMe();
      if (alive) setAuthUser(me);
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [getMe]);

  const value: AuthContextValue = {
    authUser,
    setAuthUser,
    loading,
    error,
    apiFetch,
    getMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
