"use client";

import { AuthProvider } from "@/context/AuthContext";
import { GameProvider } from "@/context/GameContext";
import { OpponentProvider } from "@/context/OpponentContext";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OpponentProvider>
      <AuthProvider>
        <GameProvider>
          <main className="flex-1 overflow-hidden">{children}</main>
        </GameProvider>
      </AuthProvider>
    </OpponentProvider>
  );
}
