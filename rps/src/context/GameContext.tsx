"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface GameContextType {
  gameId: string | null;
  setGameId: (id: string | null) => void;
  clearGameId: () => void;
  opponent_token: string | null;
  setOpponent_token: (token: string | null) => void;
  gameState: "idle" | "searching" | "found" | "playing" | "finished";
  setGameState: (
    state: "idle" | "searching" | "found" | "playing" | "finished"
  ) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameId, setGameId] = useState<string | null>(null);
  const [opponent_token, setOpponent_token] = useState<string | null>(null);
  const [gameState, setGameState] = useState<
    "idle" | "searching" | "found" | "playing" | "finished"
  >("idle");

  const clearGameId = () => setGameId(null);

  const resetGame = () => {
    setGameId(null);
    setOpponent_token(null);
    setGameState("idle");
  };

  return (
    <GameContext.Provider
      value={{
        gameId,
        setGameId,
        clearGameId,
        opponent_token,
        setOpponent_token,
        gameState,
        setGameState,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
