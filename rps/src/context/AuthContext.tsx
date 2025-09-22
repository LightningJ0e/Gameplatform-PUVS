"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export interface User {
  id: number;
  username: string;
  games_played: number;
  games_won: number;
  elo: number;
  rank: number;
  picture?: string; // base64-encoded image
  // abgeleitet – praktisch fürs UI:
  winrate?: number; // 0..100
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  setAuthenticated: (v: boolean, user?: User | null) => void;
  refreshUser: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log("AuthProvider: useEffect triggered, calling refreshUser");
    refreshUser().catch((error) => {
      console.log("AuthProvider: refreshUser failed:", error);
      setIsAuthenticated(false);
      setUser(null);
    });
  }, []);

  const setAuthenticated: AuthContextType["setAuthenticated"] = (v, u) => {
    setIsAuthenticated(v);
    if (typeof u !== "undefined") setUser(u);
  };

  const refreshUser: AuthContextType["refreshUser"] = async () => {
    try {
      console.log("AuthContext: Attempting to refresh user...");
      const res = await fetch("/api/users/me", {
        credentials: "same-origin",
        cache: "no-store",
      });
      console.log("AuthContext: Response status:", res.status);

      if (!res.ok) {
        console.log("AuthContext: Response not OK, setting unauthenticated");
        const errorText = await res.text();
        console.log("AuthContext: Error response:", errorText);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      const d = await res.json(); // {id,username,games_played,games_won,elo,rank}
      console.log("AuthContext: Received user data:", d);

      const u: User = {
        id: Number(d.id),
        username: String(d.username),
        games_played: Number(d.games_played ?? 0),
        games_won: Number(d.games_won ?? 0),
        elo: Number(d.elo ?? 0),
        rank: Number(d.rank ?? 0),
        picture: d.picture || undefined, // base64-encoded image from backend
      };
      // Winrate ableiten
      const gp = u.games_played;
      if (gp > 0) u.winrate = Math.round((u.games_won / gp) * 100);

      console.log("AuthContext: Setting user:", u);
      setUser(u);
      setIsAuthenticated(true);
    } catch (error) {
      console.log("AuthContext: Error in refreshUser:", error);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const login: AuthContextType["login"] = async (username, password) => {
    try {
      console.log("AuthContext: Starting login for username:", username);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });
      console.log("AuthContext: Login response status:", res.status);
      console.log(
        "AuthContext: Login response headers:",
        Object.fromEntries(res.headers.entries())
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.log("AuthContext: Login failed with error:", errorText);
        return false;
      }

      const responseData = await res.json();
      console.log("AuthContext: Login response data:", responseData);

      console.log("AuthContext: Login successful, calling refreshUser");
      await refreshUser(); // Cookie ist gesetzt → User laden
      console.log(
        "AuthContext: refreshUser completed, isAuthenticated should be:",
        isAuthenticated
      );
      return true;
    } catch (error) {
      console.log("AuthContext: Login error:", error);
      return false;
    }
  };

  const register: AuthContextType["register"] = async (username, password) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return false;
      await refreshUser(); // Auto-Login nach Register -> User laden
      return true;
    } catch {
      return false;
    }
  };

  const logout: AuthContextType["logout"] = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      }).catch(() => {});
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      if (typeof window !== "undefined") window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        setAuthenticated,
        refreshUser,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
