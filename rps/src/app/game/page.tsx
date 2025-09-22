"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Card from "@/components/Card";
import PlayerProfile from "@/components/PlayerProfile";
import { useAuth } from "@/context/AuthContext";
import { useGame } from "@/context/GameContext";

export default function Game() {
  const router = useRouter();
  const { user } = useAuth();
  const { gameId, clearGameId, setGameId, resetGame } = useGame();
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
  const [gamePhase, setGamePhase] = useState<
    "idle" | "ready" | "round" | "countdown"
  >("idle");
  const [currentRound, setCurrentRound] = useState(0);
  const [playedCard, setPlayedCard] = useState<{
    type: "rock" | "paper" | "scissors";
  } | null>(null);
  const [opponentPlayedCard, setOpponentPlayedCard] = useState<{
    type: "rock" | "paper" | "scissors";
  } | null>(null);
  const [playerHearts, setPlayerHearts] = useState(2);
  const [opponentHearts, setOpponentHearts] = useState(2);
  const [pageClass, setPageClass] = useState("page-slide-in-from-bottom");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Check if game ID exists, redirect to home if not
  useEffect(() => {
    // Try restoring from sessionStorage before redirecting
    if (!gameId) {
      try {
        const stored =
          typeof window !== "undefined"
            ? sessionStorage.getItem("gameId")
            : null;
        if (stored) {
          console.log("Game: Restored game ID from sessionStorage:", stored);
          // hydrate context so rest of app sees the ID
          setGameId(stored);
          return;
        }
      } catch {}
      console.log(gameId);
      console.log("Game: No game ID found, redirecting to home");
      router.push("/");
      return;
    }

    console.log("Game: Starting game with ID:", gameId);
  }, [gameId, router, clearGameId, setGameId]);

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
    if (isRoundActive || gamePhase !== "idle") return; // Verhindert mehrfaches Starten

    // Auswahl für neue Runde zurücksetzen
    setSelectedCardIndex(null);
    setPlayedCard(null);
    setOpponentPlayedCard(null);

    // Erhöhe die Rundennummer
    const nextRound = currentRound + 1;
    setCurrentRound(nextRound);

    // Starte die Phasen-Sequenz
    if (currentRound === 0) {
      // Allererste Runde: Ready -> Round -> Countdown
      setGamePhase("ready");

      // Nach 2 Sekunden: Ready -> Round
      setTimeout(() => {
        setGamePhase("round");

        // Nach weiteren 2 Sekunden: Round -> Countdown
        setTimeout(() => {
          setGamePhase("countdown");
          setIsRoundActive(true);
          setCountdown(3);
          console.log(
            `Countdown gestartet für Runde ${nextRound}! Wähle eine Karte aus...`
          );
        }, 2000);
      }, 2000);
    } else {
      // Weitere Runden: Direkt Round -> Countdown
      setGamePhase("round");

      // Nach 2 Sekunden: Round -> Countdown
      setTimeout(() => {
        setGamePhase("countdown");
        setIsRoundActive(true);
        setCountdown(3);
        console.log(
          `Countdown gestartet für Runde ${nextRound}! Wähle eine Karte aus...`
        );
      }, 2000);
    }
  };

  function handleHeartLoss(opponentCard: string, playerCard: string) {
    // Gewinnregeln: rock > scissors, scissors > paper, paper > rock
    const winConditions = {
      rock: "scissors",
      scissors: "paper",
      paper: "rock",
    };

    if (
      winConditions[playerCard as keyof typeof winConditions] === opponentCard
    ) {
      // Spieler gewinnt - Gegner verliert Herz
      setOpponentHearts((prev) => Math.max(0, prev - 1));
      console.log(`Spieler gewinnt! ${playerCard} besiegt ${opponentCard}`);
      return "player";
    } else if (
      winConditions[opponentCard as keyof typeof winConditions] === playerCard
    ) {
      // Gegner gewinnt - Spieler verliert Herz
      setPlayerHearts((prev) => Math.max(0, prev - 1));
      console.log(`Gegner gewinnt! ${opponentCard} besiegt ${playerCard}`);
      return "opponent";
    } else {
      // Unentschieden - niemand verliert Herz
      console.log(`Unentschieden! Beide haben ${playerCard} gespielt`);
      return "tie";
    }
  }

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
      setGamePhase("idle");

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

      // Gespielte Karte setzen
      if (finalCardIndex !== null) {
        setPlayedCard({
          type: playerCards[finalCardIndex],
        });
      }

      // Bot wählt zufällige Karte
      const randomOpponentIndex = Math.floor(
        Math.random() * opponentCards.length
      );
      setOpponentPlayedCard({
        type: opponentCards[randomOpponentIndex],
      });
      console.log(`Bot hat ${opponentCards[randomOpponentIndex]} gewählt`);

      // Gewinner ermitteln und Herzen abziehen
      if (finalCardIndex !== null) {
        const winner = handleHeartLoss(
          opponentCards[randomOpponentIndex],
          playerCards[finalCardIndex]
        );
      }

      console.log("Runde beendet!");
    }
  }, [countdown]);

  // Navigation mit Animation
  const navigateWithAnimation = (href: string) => {
    setPageClass("page-slide-out-up");
    setTimeout(() => {
      router.push(href);
    }, 500);
  };

  // Navigation zurück zur Home mit Game-Reset
  const navigateBackToHome = () => {
    console.log("Game: Navigating back to home and resetting game state");

    // Reset des gesamten Game-Zustands
    resetGame();

    // Navigation mit Animation
    navigateWithAnimation("/");
  };

  // Spiel-Ende-Überwachung
  useEffect(() => {
    if (playerHearts === 0 || opponentHearts === 0) {
      // Nach 2 Sekunden zur Startseite mit Game-Reset
      setTimeout(() => {
        navigateBackToHome();
      }, 2000);
    }
  }, [playerHearts, opponentHearts]);

  // Load saved profile data from localStorage and setup card reveal
  useEffect(() => {
    // Load saved profile image from localStorage
    const savedImage = localStorage.getItem("profileImage");

    if (savedImage) {
      setProfileImage(savedImage);
    }

    // Aufdecken der Spielerkarten
    const timer1 = setTimeout(() => {
      setPlayerCardsRevealed((prev) => [true, prev[1], prev[2]]);
    }, 800);

    const timer2 = setTimeout(() => {
      setPlayerCardsRevealed((prev) => [prev[0], true, prev[2]]);
    }, 1100);

    const timer3 = setTimeout(() => {
      setPlayerCardsRevealed((prev) => [prev[0], prev[1], true]);
    }, 1400);

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

      {/* Game Container */}
      <div
        className={`h-screen bg-slate-900 relative overflow-hidden text-white flex flex-col justify-center ${pageClass}`}
      >
        {/* Opponent Profile - Top Left */}
        <PlayerProfile
          username={opponent.username}
          hearts={opponentHearts}
          maxHearts={2}
          position="top-left"
          playerId="opponent"
          onHeartBreak={(heartIndex) => {
            console.log(`Opponent heart ${heartIndex} broke!`);
            // Hier können Sie zusätzliche Effekte hinzufügen
          }}
        />

        {/* Player Profile - Bottom Left */}
        {user && (
          <PlayerProfile
            username={user.username}
            profileImage={profileImage || undefined}
            hearts={playerHearts}
            maxHearts={2}
            position="bottom-left"
            rankingPosition={1}
            playerId="player"
            onHeartBreak={(heartIndex) => {
              console.log(`Player heart ${heartIndex} broke!`);
              // Hier können Sie zusätzliche Effekte hinzufügen
            }}
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
            <span className="text-white text-6xl font-bold">
              {currentRound}
            </span>
          </div>
        </div>

        {/* Mittlere Spielbereich */}
        <div className="flex flex-col items-center justify-center gap-4 py-6 relative">
          {/* Gegner-Platzhalter (oben) */}
          <div className="w-32 h-44">
            {opponentPlayedCard ? (
              <Card
                type={opponentPlayedCard.type}
                size="medium"
                isFlipped={true}
                isInteractive={false}
              />
            ) : (
              <div className="w-32 h-44 bg-slate-700 rounded-lg opacity-50"></div>
            )}
          </div>

          {/* Spieler-Karten-Bereich */}
          <div className="relative w-32 h-44">
            {playedCard ? (
              <Card
                type={playedCard.type}
                size="medium"
                isFlipped={true}
                isInteractive={false}
              />
            ) : (
              <div className="w-32 h-44 bg-slate-700 rounded-lg opacity-50"></div>
            )}
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

        {/* Game Phase Display - Zentriert */}
        {gamePhase === "ready" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="text-center">
              <h1 className="text-white text-8xl font-bold animate-pulse">
                Ready?
              </h1>
            </div>
          </div>
        )}

        {gamePhase === "round" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="text-center">
              <h1 className="text-white text-8xl font-bold animate-bounce">
                Round {currentRound}
              </h1>
            </div>
          </div>
        )}

        {opponentHearts === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="text-center">
              <h1 className="text-white text-8xl font-bold animate-bounce">
                You won!
              </h1>
            </div>
          </div>
        )}

        {playerHearts === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="text-center">
              <h1 className="text-white text-8xl font-bold animate-bounce">
                You lost!
              </h1>
            </div>
          </div>
        )}

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
            {isRoundActive || gamePhase !== "idle"
              ? "Runde läuft..."
              : "Runde Starten"}
          </button>

          {/* Zurück-Button */}
          <button
            onClick={navigateBackToHome}
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
