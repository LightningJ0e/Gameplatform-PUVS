"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Card from "@/components/Card";
import PlayerProfile from "@/components/PlayerProfile";
import { useAuth } from "@/context/AuthContext";

export default function Game() {
  const router = useRouter();
  const { user } = useAuth();
  const [playerCardsRevealed, setPlayerCardsRevealed] = useState([
    false,
    false,
    false,
  ]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null
  );
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingCardIndex, setAnimatingCardIndex] = useState<number | null>(
    null
  );

  // Spieler- und Gegnerkarten (vorläufig alle als "rock" für das Layout)
  const playerCards = ["rock", "paper", "scissors"] as const;
  const opponentCards = ["rock", "paper", "scissors"] as const;

  // Mock opponent data
  const opponent = {
    username: "Computer",
    hearts: 2,
  };

  // Funktion zum Auswählen einer Karte
  const handleCardSelect = (index: number, cardType: string) => {
    setSelectedCardIndex(index);
    console.log(`Selected ${cardType} at index ${index}`);
  };

  // Funktion zum Starten der Runde
  const startRound = () => {
    if (isRoundActive) return; // Verhindert mehrfaches Starten

    // Auswahl für neue Runde zurücksetzen
    setSelectedCardIndex(null);
    setIsRoundActive(true);
    setCountdown(3);
    console.log("Neue Runde gestartet! Wähle eine Karte aus...");
  };

  // Countdown-Effekt
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown beendet
      setIsRoundActive(false);
      setCountdown(null);

      // Prüfen ob eine Karte ausgewählt ist, wenn nicht -> zufällige auswählen
      let finalCardIndex = selectedCardIndex;
      if (selectedCardIndex === null) {
        finalCardIndex = Math.floor(Math.random() * playerCards.length);
        setSelectedCardIndex(finalCardIndex);
        console.log(
          `Keine Karte gewählt! Zufällig ausgewählt: ${playerCards[finalCardIndex]} (Index: ${finalCardIndex})`
        );
      } else {
        console.log(
          `Spieler hat ${playerCards[selectedCardIndex]} gewählt (Index: ${selectedCardIndex})`
        );
      }

      setIsAnimating(true);
      setAnimatingCardIndex(finalCardIndex);

      setTimeout(() => {
        setIsAnimating(false);
        setAnimatingCardIndex(null);
      }, 2000);

      console.log("Runde beendet!");
    }
  }, [countdown]);

  // Aufdecken der Spielerkarten
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setPlayerCardsRevealed((prev) => [true, prev[1], prev[2]]);
    }, 500);

    const timer2 = setTimeout(() => {
      setPlayerCardsRevealed((prev) => [prev[0], true, prev[2]]);
    }, 800);

    const timer3 = setTimeout(() => {
      setPlayerCardsRevealed((prev) => [prev[0], prev[1], true]);
    }, 1100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <>
      <style jsx>{`
        .cardAnimation {
          animation: cardAnimation 2s ease-out forwards;
          z-index: 50;
        }

        @keyframes cardAnimation {
          0% {
            transform: translateY(0) scale(1);
          }
          100% {
            transform: translate(calc(-0% + -35vw), calc(50% - 30vh)) scale(0.4)
              rotate(-10deg);
          }
        }
      `}</style>

      {/* CSS Animation für schwebende Karte */}
      {/* Game Container */}
      <div className="h-screen bg-slate-900 relative overflow-hidden text-white flex flex-col justify-center">
        {/* Opponent Profile - Top Left */}
        <PlayerProfile
          username={opponent.username}
          hearts={opponent.hearts}
          position="top-left"
        />

        {/* Player Profile - Bottom Left */}
        {user && (
          <PlayerProfile
            username={user.username}
            hearts={2}
            position="bottom-left"
            rankingPosition={1}
          />
        )}

        {/* Gegnerkarten (oben) - mit Rückseite */}
        <div className="flex items-center justify-center py-8">
          <div className="flex gap-6">
            {opponentCards.map((cardType, index) => (
              <div
                key={`opponent-${index}`}
                className={`
            ${index === 0 ? "transform rotate-12 -translate-y-4" : ""}
            ${index === 1 ? "transform translate-y-0" : ""}
            ${index === 2 ? "transform -rotate-12 -translate-y-4" : ""}`}
              >
                <Card
                  type={cardType}
                  size="small"
                  isFlipped={false}
                  isInteractive={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Round Counter */}
        <div className="absolute top-16 right-1/7 p-2 ">
          <div className="text-center">
            <h1 className="text-white font-semibold text-4xl mb-6">Round</h1>
            <span className="text-white text-6xl font-bold">1</span>
          </div>
        </div>

        {/* Mittlere Spielbereich */}
        <div className="flex flex-col items-center justify-center gap-4 py-6 relative">
          {/* Gegner-Platzhalter (oben) */}
          <div className="w-32 h-44 bg-slate-700 rounded-lg opacity-50"></div>

          {/* Spieler-Karten-Bereich */}
          <div className="relative w-32 h-44">
            <div className="w-32 h-44 bg-slate-700 rounded-lg opacity-50"></div>
          </div>
        </div>

        {/* Spielerkarten (unten) */}
        <div className="flex items-center justify-center py-8">
          <div className="flex gap-8">
            {playerCards.map((cardType, index) => (
              <div
                key={`player-${index}`}
                className={`
                  ${
                    index === 0
                      ? "transform -rotate-10 translate-y-4"
                      : index === 1
                      ? "transform translate-y-0"
                      : "transform rotate-10 translate-y-4"
                  }
                      ${
                        isAnimating && animatingCardIndex === index
                          ? "cardAnimation"
                          : ""
                      }
                `}
              >
                <Card
                  type={cardType}
                  size="large"
                  isFlipped={playerCardsRevealed[index]}
                  isSelected={selectedCardIndex === index}
                  onClick={() => handleCardSelect(index, cardType)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Countdown Display - Rechte Seite */}
        {countdown !== null && (
          <div className="absolute top-1/2 right-8 transform -translate-y-1/2 bg-slate-800/90 backdrop-blur-sm rounded-lg p-6 z-10">
            <div className="text-center">
              <h3 className="text-white font-semibold text-lg mb-2">Zeit</h3>
              <div className="text-4xl font-bold text-red-500">{countdown}</div>
            </div>
          </div>
        )}

        {/* Test Buttons - Unten rechts */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-10">
          {/* Runde Starten Button */}
          <button
            onClick={startRound}
            disabled={isRoundActive}
            className={`
            px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg
            ${
              isRoundActive
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-500 text-white"
            }
          `}
          >
            {isRoundActive ? "Runde läuft..." : "Runde Starten"}
          </button>

          {/* Zurück-Button */}
          <button
            onClick={() => router.push("/")}
            className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
            title="Zurück zur Hauptseite"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
