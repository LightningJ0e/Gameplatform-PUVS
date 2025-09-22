"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Opponent {
  id: number;
  username: string;
  games_played: number;
  games_won: number;
  elo: number;
  rank: number;
  winrate?: number; // 0..100
  token: string;
  picture: string;
}

interface OpponentContextType {
  opponent: Opponent | null;
  setOpponent: (opponent: Opponent | null) => void;
  clearOpponent: () => void;
  updateOpponentStats: (
    stats: Partial<Omit<Opponent, "id" | "username" | "token">>
  ) => void;
}

const OpponentContext = createContext<OpponentContextType | undefined>(
  undefined
);

export function OpponentProvider({ children }: { children: ReactNode }) {
  const [opponent, setOpponentState] = useState<Opponent | null>(null);

  const setOpponent = (newOpponent: Opponent | null) => {
    setOpponentState(newOpponent);
  };

  const clearOpponent = () => {
    setOpponentState(null);
  };

  const updateOpponentStats = (
    stats: Partial<Omit<Opponent, "id" | "username" | "token">>
  ) => {
    if (!opponent) return;

    const updatedOpponent = { ...opponent, ...stats };
    setOpponentState(updatedOpponent);
  };

  return (
    <OpponentContext.Provider
      value={{
        opponent,
        setOpponent,
        clearOpponent,
        updateOpponentStats,
      }}
    >
      {children}
    </OpponentContext.Provider>
  );
}

export function useOpponent() {
  const context = useContext(OpponentContext);
  if (context === undefined) {
    throw new Error("useOpponent must be used within an OpponentProvider");
  }
  return context;
}
