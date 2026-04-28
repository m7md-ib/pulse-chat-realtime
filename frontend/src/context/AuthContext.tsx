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
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    api
      .get("/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
      .then(({ data }) => {
        setUser(data.user);
        setToken(storedToken);

        // ⚠️ مهم: socket شغّله هون فقط
        initSocket(storedToken);
      })
      .catch((err) => {
        console.error("Auth error:", err);

        // ❌ لا تمسح التوكن إلا إذا 401 فقط
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          setToken(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    initSocket(data.token);
  };

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
    initSocket(data.token);
  };

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
