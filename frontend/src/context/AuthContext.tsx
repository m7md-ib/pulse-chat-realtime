import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../types";
import api from "../services/api";
import { initSocket, disconnectSocket } from "../services/socket";

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ================= LOAD USER ON START =================
  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);

    api
      .get("/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
      .then(({ data }) => {
        setUser(data.user);
      })
      .catch((err) => {
        console.error("Auth error:", err);

        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ================= SOCKET CONTROL =================
  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }

    disconnectSocket();
    initSocket(token);
  }, [token]);

  // ================= LOGIN =================
  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });

    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  // ================= REGISTER =================
  const register = async (
    username: string,
    email: string,
    password: string,
  ) => {
    const { data } = await api.post("/auth/register", {
      username,
      email,
      password,
    });

    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
