"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

interface Props {
  onNavigate: (href: string, animationType?: string) => void;
  showRanking: boolean;
  setShowRanking: (show: boolean) => void;
}

export default function Header({
  onNavigate,
  setShowRanking,
  showRanking,
}: Props) {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  // Header auf der Spielseite ausblenden
  if (pathname === "/game") {
    return null;
  }

  if (isAuthenticated && user) {
    // Angemeldeter Benutzer
    return (
      <header className="flex justify-between items-center p-6 relative z-10 bg-slate-900">
        <Link href="/" className="text-white text-xl font-bold">
          RPS Game
        </Link>
        <div className="flex items-center space-x-4">
          <button
            className="text-gray-300 hover:text-white transition-colors"
            onClick={() => setShowRanking(!showRanking)}
          >
            Ranking
          </button>
          <span className="text-gray-300">Hallo, {user.username}!</span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </header>
    );
  }

  // Nicht angemeldeter Benutzer
  return (
    <header className="flex justify-end space-x-4 p-6 relative z-10 bg-slate-900">
      <button
        onClick={() => onNavigate("/login", "page-slide-out-right")}
        className="px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-700 text-white"
      >
        Login
      </button>
      <button
        onClick={() => onNavigate("/register", "page-slide-out-right")}
        className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-500 text-white"
      >
        Register
      </button>
    </header>
  );
}
