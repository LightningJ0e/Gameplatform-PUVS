"use client";

import { useState, useEffect } from "react";

interface Player {
  id: number;
  username: string;
  score: number;
  picture?: string;
}

export default function Ranking({
  setShowRanking,
}: {
  setShowRanking: (show: boolean) => void;
}) {
  const [pageClass, setPageClass] = useState("page-slide-in-from-left");
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/ranking", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load ranking");
        const data = (await res.json()) as Player[];
        if (!active) return;
        // Sicherstellen: absteigend nach score
        setPlayers([...data].sort((a, b) => b.score - a.score));
      } catch (e) {
        // Optional: Fehlerzustand setzen/anzeigen
        console.error(e);
        if (active) setPlayers([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const navigateBack = () => {
    setPageClass("page-slide-out-left");
    setTimeout(() => {
      setShowRanking(false);
    }, 500);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-400";
      case 2:
        return "text-gray-300";
      case 3:
        return "text-orange-400";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className={`h-full bg-slate-900 px-6 py-8 ${pageClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={navigateBack}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold text-white">Ranking list</h1>
        <div className="w-16"></div> {/* Spacer */}
      </div>

      {/* Ranking Liste */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-lg overflow-hidden shadow-xl">
          {players.map((player, index) => {
            const rank = index + 1;
            return (
              <div
                key={player.id}
                className={`flex items-center p-6 border-b border-slate-700 hover:bg-slate-750 transition-colors ${
                  rank <= 3 ? "bg-slate-750" : ""
                }`}
              >
                {/* Rang */}
                <div
                  className={`text-2xl font-bold w-16 ${getRankColor(rank)}`}
                >
                  {getRankIcon(rank)}
                </div>

                {/* Profilbild */}
                <div className="w-16 h-16 mx-6">
                  {player.picture ? (
                    <img
                      src={player.picture}
                      alt={`${player.username} avatar`}
                      className="w-full h-full rounded-full object-cover border-2 border-slate-600"
                      onError={(e) => {
                        // Fallback wenn Bild nicht gefunden wird
                        (
                          e.target as HTMLImageElement
                        ).src = `https://ui-avatars.com/api/?name=${player.username}&background=475569&color=fff&size=64`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-xl">
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Spielername */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white">
                    {player.username}
                  </h3>
                  <p className="text-gray-400">Rank {rank}</p>
                </div>

                {/* Punktezahl */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {player.score.toLocaleString()}
                  </div>
                  <div className="text-gray-400">Elo</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Zusätzliche Statistiken */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-400">
              {players.length}
            </div>
            <div className="text-gray-400">Active players</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-400">
              {players.length > 0 ? players[0].score.toLocaleString() : "0"}
            </div>
            <div className="text-gray-400">Highest score</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-400">
              {players.length > 0
                ? Math.round(
                    players.reduce((sum, p) => sum + p.score, 0) /
                      players.length
                  ).toLocaleString()
                : "0"}
            </div>
            <div className="text-gray-400">Average</div>
          </div>
        </div>
      </div>
    </div>
  );
}
