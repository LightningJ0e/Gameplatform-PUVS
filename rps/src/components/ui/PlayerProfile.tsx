"use client";

import { useState, useEffect } from "react";

interface PlayerProfileProps {
  username: string;
  profileImage?: string;
  hearts?: number;
  position: "top-left" | "bottom-left" | "relative";
  rankingPosition?: number;
  maxHearts?: number;
  onHeartBreak?: (heartIndex: number) => void;
  playerId?: string;
  elo?: number;
  winrate?: number;
}

export default function PlayerProfile({
  username,
  profileImage,
  hearts = 2,
  position,
  rankingPosition,
  maxHearts = 2,
  onHeartBreak,
  playerId = "player",
  elo,
  winrate,
}: PlayerProfileProps) {
  console.log("PlayerProfile received:", {
    username,
    hasImage: !!profileImage,
  });

  const [heartStates, setHeartStates] = useState<
    ("full" | "breaking" | "broken")[]
  >([]);
  const [previousHearts, setPreviousHearts] = useState(hearts);

  // Initialize heart states
  useEffect(() => {
    const initialStates = Array.from({ length: maxHearts }, (_, index) =>
      index < hearts ? "full" : "broken"
    ) as ("full" | "breaking" | "broken")[];
    setHeartStates(initialStates);
    setPreviousHearts(hearts);
  }, [maxHearts]);

  // Handle heart breaking animation when hearts decrease
  useEffect(() => {
    if (hearts < previousHearts) {
      const heartsLost = previousHearts - hearts;

      // Animate hearts breaking from right to left
      for (let i = 0; i < heartsLost; i++) {
        const heartIndex = previousHearts - 1 - i;

        setTimeout(() => {
          setHeartStates((prev) => {
            const newStates = [...prev];
            newStates[heartIndex] = "breaking";
            return newStates;
          });

          // Call callback if provided
          if (onHeartBreak) {
            onHeartBreak(heartIndex);
          }

          // After animation, set to broken
          setTimeout(() => {
            setHeartStates((prev) => {
              const newStates = [...prev];
              newStates[heartIndex] = "broken";
              return newStates;
            });
          }, 800); // Animation duration
        }, i * 200); // Stagger the animations
      }
    }

    setPreviousHearts(hearts);
  }, [hearts, previousHearts, onHeartBreak]);

  const positionClasses = {
    "top-left": "absolute top-16 left-16 ",
    "bottom-left": "absolute bottom-16 left-16",
    relative: "",
  };

  return (
    <div
      className={`${positionClasses[position]} flex items-center gap-3 p-3 z-10`}
    >
      {/* Profilbild mit Gradient Border und Ranking-Raute */}
      <div className="flex flex-col items-center gap-0">
        <div className="w-20 h-20 rounded-full bg-gradient-to-b from-amber-500 via-amber-200 to-amber-600 p-1 flex items-center justify-center">
          <div className="w-full h-full rounded-full overflow-hidden bg-slate-600 flex items-center justify-center ">
            {profileImage ? (
              <img
                src={profileImage}
                alt={`${username} Profilbild`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Ranking-Raute */}
        {rankingPosition && rankingPosition > 0 && (
          <div className="relative -mt-3">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-400 via-amber-200 to-amber-600 transform rotate-45 flex items-center justify-center shadow-lg">
              <span className="text-black font-bold text-sm transform -rotate-45">
                {rankingPosition}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Username und Herzen */}
      <div className="flex flex-col">
        <span className="text-white font-semibold text-lg p-1">{username}</span>
        {position !== "relative" && (
          <div className="flex gap-1 p-1">
            {heartStates.map((state, index) => (
              <div key={index} className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className={`w-7 h-7 transition-all duration-300 ${
                    state === "breaking"
                      ? "animate-bounce scale-125"
                      : state === "broken"
                      ? "opacity-30 scale-90"
                      : "scale-100"
                  }`}
                >
                  <defs>
                    <linearGradient
                      id={`heartGradient-${playerId}-${index}`}
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor={state === "broken" ? "#6b7280" : "#f87171"}
                      />
                      <stop
                        offset="50%"
                        stopColor={state === "broken" ? "#4b5563" : "#ef4444"}
                      />
                      <stop
                        offset="100%"
                        stopColor={state === "broken" ? "#374151" : "#dc2626"}
                      />
                    </linearGradient>
                  </defs>
                  <path
                    fill={`url(#heartGradient-${playerId}-${index})`}
                    d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"
                  />
                </svg>

                {/* Breaking Effect */}
                {state === "breaking" && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Crack lines */}
                    <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-red-800 transform -translate-x-1/2 -translate-y-1/2 rotate-45 animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/2 w-0.5 h-3 bg-red-800 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 animate-pulse"></div>

                    {/* Particle effects */}
                    <div className="absolute top-1 left-1 w-1 h-1 bg-red-400 rounded-full animate-ping"></div>
                    <div
                      className="absolute top-2 right-1 w-1 h-1 bg-red-400 rounded-full animate-ping"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="absolute bottom-1 left-2 w-1 h-1 bg-red-400 rounded-full animate-ping"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
