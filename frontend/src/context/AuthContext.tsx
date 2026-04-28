import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { User, AuthResponse } from "../types";
import api from "../services/api";
import { tokenService } from "../services/tokenService";
import { initSocket, disconnectSocket } from "../services/socket";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Persist session on app start ────────────────────────────────────────
  useEffect(() => {
    const storedToken = tokenService.get();

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    // Validate token against server
    api
      .get<{ user: User }>("/auth/me")
      .then(({ data }) => {
        setToken(storedToken);
        setUser(data.user);
      })
      .catch(() => {
        // Token invalid or expired — clear everything
        tokenService.remove();
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ─── Socket lifecycle — driven by token ──────────────────────────────────
  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }

    const s = initSocket(token);

    return () => {
      // Cleanup on token change or unmount — but don't kill socket on rerender
      // Only disconnect when token becomes null (handled above)
      s?.off("connect");
      s?.off("disconnect");
    };
  }, [token]);

  // ─── Set session helper ───────────────────────────────────────────────────
  const setSession = useCallback((data: AuthResponse) => {
    tokenService.set(data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<AuthResponse>("/api/auth/login", {
        email,
        password,
      });
      setSession(data);
    },
    [setSession],
  );

  // ─── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const { data } = await api.post<AuthResponse>("/auth/register", {
        username,
        email,
        password,
      });
      setSession(data);
    },
    [setSession],
  );

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    tokenService.remove();
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within <AuthProvider>");
  return context;
};
