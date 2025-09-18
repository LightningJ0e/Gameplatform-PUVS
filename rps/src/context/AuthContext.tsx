"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Hartcodierter User
  const hardcodedUser = {
    username: "admin",
    password: "password123",
    id: "1",
  };

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    // Überprüfung gegen hartcodierten User
    if (
      username === hardcodedUser.username &&
      password === hardcodedUser.password
    ) {
      const user: User = {
        id: hardcodedUser.id,
        username: hardcodedUser.username,
      };
      setUser(user);
      return true;
    }
    return false;
  };

  const register = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    if (username && password) {
      const mockUser: User = {
        id: Math.random().toString(36),
        username: username,
      };
      setUser(mockUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
