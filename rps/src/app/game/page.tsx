"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";

import Card from "@/components/ui/Card";
import PlayerProfile from "@/components/ui/PlayerProfile";
import { useAuth } from "@/context/AuthContext";
import { useGame } from "@/context/GameContext";
import { useOpponent } from "@/context/OpponentContext";

import {
  PLAYER_CARDS,
  CARD_TO_MOVE,
  MOVE_TO_CARD,
  type Card as RpsCard,
  type Move,
} from "@/utils/cards";

import { apiReady, apiMove } from "@/services/gameApi";

// kleine Helfer
function toMoveNum(m: unknown): Move | null {
  if (m === null || m === undefined) return null;
  if (typeof m === "number" && m >= 0 && m <= 2) return m as Move;
  if (typeof m === "string") {
    const s = m.trim().toLowerCase();
    if (s === "rock") return 0;
    if (s === "paper") return 1;
    if (s === "scissors") return 2;
    if (/^[0-2]$/.test(s)) return Number(s) as Move;
  }
  return null;
}

type Phase = "idle" | "ready" | "round" | "countdown";

export default function Game() {
  const router = useRouter();
  const { user } = useAuth();
  const { opponent } = useOpponent();
  const { gameId, setGameId, resetGame } = useGame();

  // UI-State (minimal)
  const [playerCardsRevealed, setPlayerCardsRevealed] = useState<
    [boolean, boolean, boolean]
  >([false, false, false]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null
  );

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [gamePhase, setGamePhase] = useState<Phase>("idle");
  const [currentRound, setCurrentRound] = useState(0);
  const [roundBanner, setRoundBanner] = useState<string | null>(null);

  const [playedCard, setPlayedCard] = useState<{ type: RpsCard } | null>(null);
  const [opponentPlayedCard, setOpponentPlayedCard] = useState<{
    type: RpsCard;
  } | null>(null);

  const [playerHearts, setPlayerHearts] = useState(2);
  const [opponentHearts, setOpponentHearts] = useState(2);

  // Timer/Interval Refs
  const isReadyIntRef = useRef<number | null>(null);
  const resultIntRef = useRef<number | null>(null);
  const lastChosenMoveRef = useRef<Move | null>(null);
  const startedRef = useRef(false); // sorgt dafür, dass startRound nur einmal passiert

  const clearIsReady = () => {
    if (isReadyIntRef.current) {
      clearInterval(isReadyIntRef.current);
      isReadyIntRef.current = null;
    }
  };
  const clearResultPoll = () => {
    if (resultIntRef.current) {
      clearInterval(resultIntRef.current);
      resultIntRef.current = null;
    }
  };

  // gameId sichern/hydrieren
  useEffect(() => {
    if (!gameId) {
      try {
        const stored =
          typeof window !== "undefined"
            ? sessionStorage.getItem("gameId")
            : null;
        if (stored) {
          setGameId(stored);
          return;
        }
      } catch {}
      router.push("/");
    }
  }, [gameId, router, setGameId]);

  // Initial: Karten-Flip-Intro + ready + isReady-Polling (einmalig bis Start)
  useEffect(() => {
    const t1 = window.setTimeout(
      () => setPlayerCardsRevealed((p) => [true, p[1], p[2]]),
      300
    );
    const t2 = window.setTimeout(
      () => setPlayerCardsRevealed((p) => [p[0], true, p[2]]),
      550
    );
    const t3 = window.setTimeout(
      () => setPlayerCardsRevealed((p) => [p[0], p[1], true]),
      800
    );

    (async () => {
      const id =
        gameId ??
        (typeof window !== "undefined"
          ? sessionStorage.getItem("gameId")
          : null);
      if (!id) return;
      try {
        await apiReady(id); // nur für Runde 1
        // isReady pollt bis „ready“ (und startet genau 1x die Runde)
        clearIsReady();
        isReadyIntRef.current = window.setInterval(async () => {
          try {
            const rsp = await fetch(
              `/api/game/isready?gameId=${encodeURIComponent(id)}`
            );
            if (!rsp.ok) return;
            const data = await rsp.json();
            if (data?.message === "ready" && !startedRef.current) {
              startedRef.current = true;
              clearIsReady();
              startRound();
            }
          } catch {}
        }, 300);
      } catch (e) {
        console.error("Initial apiReady failed:", e);
      }
    })();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearIsReady();
      clearResultPoll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Karte wählen
  const handleCardSelect = (index: number) => setSelectedCardIndex(index);

  // EINMALIGE Runde starten
  const startRound = useCallback(() => {
    if (isRoundActive || gamePhase !== "idle") return;

    setPlayedCard(null);
    setOpponentPlayedCard(null);

    setCurrentRound(1);
    setGamePhase("ready");
    setTimeout(() => {
      setGamePhase("round");
      setTimeout(() => {
        setGamePhase("countdown");
        setIsRoundActive(true);
        setCountdown(7);
      }, 800);
    }, 800);
  }, [gamePhase, isRoundActive]);

  // Countdown → Move → Ergebnis einmalig pollen
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const tm = window.setTimeout(
        () => setCountdown((c) => (c ?? 1) - 1),
        1000
      );
      return () => clearTimeout(tm);
    }

    // countdown = 0
    setIsRoundActive(false);
    setCountdown(null);
    setGamePhase("idle");

    // final card index (falls keine gewählt: Zufall)
    let finalIdx = selectedCardIndex;
    if (finalIdx === null) {
      finalIdx = Math.floor(Math.random() * PLAYER_CARDS.length);
      setSelectedCardIndex(finalIdx);
    }
    if (finalIdx === null) return;

    const chosen = PLAYER_CARDS[finalIdx];
    const moveNum: Move = CARD_TO_MOVE[chosen];
    lastChosenMoveRef.current = moveNum;

    (async () => {
      const id =
        gameId ??
        (typeof window !== "undefined"
          ? sessionStorage.getItem("gameId")
          : null);
      if (!id) return;

      try {
        await apiMove(id, moveNum);

        // Ergebnis pollen bis previous_round.complete → Karten & Herzen setzen; dann stoppen
        clearResultPoll();
        resultIntRef.current = window.setInterval(async () => {
          try {
            const rsp = await fetch(
              `/api/game/state?gameId=${encodeURIComponent(id)}`
            );
            if (!rsp.ok) return;
            const raw = await rsp.json();

            const prev = raw?.previous_round;
            if (!prev || prev?.status !== "complete") return;

            // Eigene Karte
            const myMoveNum =
              toMoveNum(
                prev?.player_move ??
                  prev?.p1_move ??
                  prev?.move_p1 ??
                  prev?.p1_action
              ) ?? lastChosenMoveRef.current;
            setPlayedCard(
              myMoveNum != null
                ? { type: MOVE_TO_CARD[myMoveNum as 0 | 1 | 2] }
                : null
            );

            // Gegnerkarte
            const oppMoveNum = toMoveNum(
              prev?.opponent_move ??
                prev?.p2_move ??
                prev?.move_p2 ??
                prev?.p2_action
            );
            setOpponentPlayedCard(
              oppMoveNum != null
                ? { type: MOVE_TO_CARD[oppMoveNum as 0 | 1 | 2] }
                : null
            );

            // Herzen
            const livesP1 = raw?.lives_p1;
            const livesP2 = raw?.lives_p2;
            const p1Id = raw?.player_1_id;
            const myId = (user as any)?.id ?? (user as any)?.userId ?? null;
            const amP1 = myId ? p1Id === myId : true;
            const serverMyLives = amP1 ? livesP1 : livesP2;
            const serverOppLives = amP1 ? livesP2 : livesP1;

            if (typeof serverMyLives === "number")
              setPlayerHearts(serverMyLives);
            if (typeof serverOppLives === "number")
              setOpponentHearts(serverOppLives);

            // fertig → Polling stoppen (kein Loop danach)
            clearResultPoll();

            let winnerName = "draw";
            if (prev?.winner === "p1" || prev?.winner === "p2") {
              const didP1Win = prev.winner === "p1";
              const winIsMe = (didP1Win && amP1) || (!didP1Win && !amP1);
              winnerName = winIsMe
                ? user?.username ?? "You"
                : opponent?.username ?? "Opponent";
            } else if (raw?.winner_player_id) {
              const winIsMe = raw.winner_player_id === myId;
              winnerName = winIsMe
                ? user?.username ?? "You"
                : opponent?.username ?? "Opponent";
            }
            const roundNo =
              prev?.round_no ??
              (typeof raw?.current_round?.round_no === "number"
                ? raw.current_round.round_no - 1
                : undefined);

            // Banner nach 2 Sekunden anzeigen
            setTimeout(() => {
              setRoundBanner(
                `Round ${roundNo}: ${winnerName} ${
                  winnerName === "draw" ? "" : "won"
                }`
              );
            }, 2000);
            setTimeout(() => {
              setRoundBanner(null);
            }, 3000);
            setTimeout(() => {
              setPlayedCard(null);
              setOpponentPlayedCard(null);
            }, 4000);
          } catch {}
        }, 300);
      } catch (e) {
        console.error("apiMove failed:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  // Home
  const navigateBackToHome = () => {
    resetGame();
    router.push("/");
  };

  return (
    <div className="h-screen bg-slate-900 relative overflow-hidden text-white flex flex-col justify-center">
      {/* Opponent */}
      <PlayerProfile
        username={opponent?.username || "Unknown Opponent"}
        profileImage={
          opponent?.picture
            ? `data:image/png;base64,${opponent.picture}`
            : undefined
        }
        hearts={opponentHearts}
        maxHearts={2}
        position="top-left"
        rankingPosition={opponent?.rank}
        elo={opponent?.elo}
        winrate={opponent?.winrate}
        playerId="opponent"
      />

      {/* Player */}
      {user && (
        <PlayerProfile
          username={user.username || "Player"}
          profileImage={
            user.picture ? `data:image/png;base64,${user.picture}` : undefined
          }
          hearts={playerHearts}
          maxHearts={2}
          position="bottom-left"
          rankingPosition={user.rank}
          elo={user.elo}
          winrate={user.winrate}
          playerId="player"
        />
      )}

      {/* Gegnerkarten (verdeckt) */}
      <div className="flex items-center justify-center py-8">
        <div className="flex gap-6">
          {PLAYER_CARDS.map((cardType, index) => (
            <div
              key={`opponent-${index}`}
              className={`${
                index === 0 ? "transform rotate-12 -translate-y-4" : ""
              } ${index === 1 ? "transform translate-y-0" : ""} ${
                index === 2 ? "transform -rotate-12 -translate-y-4" : ""
              }`}
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
          <span className="text-white text-6xl font-bold">{currentRound}</span>
        </div>
      </div>

      {/* Mitte: Reveal */}
      <div className="flex flex-col items-center justify-center gap-4 py-6 relative">
        <div className="w-32 h-44">
          {opponentPlayedCard ? (
            <Card
              type={opponentPlayedCard.type}
              size="medium"
              isFlipped={true}
              isInteractive={false}
            />
          ) : (
            <div className="w-32 h-44 bg-slate-700 rounded-lg opacity-50" />
          )}
        </div>

        <div className="relative w-32 h-44">
          {playedCard ? (
            <Card
              type={playedCard.type}
              size="medium"
              isFlipped={true}
              isInteractive={false}
            />
          ) : (
            <div className="w-32 h-44 bg-slate-700 rounded-lg opacity-50" />
          )}
        </div>
      </div>

      {/* Eigene Karten unten */}
      <div className="flex items-center justify-center py-8">
        <div className="flex gap-8">
          {PLAYER_CARDS.map((cardType, index) => (
            <div
              key={`player-${index}`}
              className={`${
                index === 0
                  ? "transform -rotate-10 translate-y-4"
                  : index === 1
                  ? "transform translate-y-0"
                  : "transform rotate-10 translate-y-4"
              }`}
            >
              <Card
                type={cardType}
                size="large"
                isFlipped={playerCardsRevealed[index]}
                isSelected={selectedCardIndex === index}
                onClick={() => handleCardSelect(index)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Phasen Overlays (schlank) */}
      {gamePhase === "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <h1 className="text-white text-8xl font-bold animate-pulse">
            Ready?
          </h1>
        </div>
      )}
      {gamePhase === "round" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <h1 className="text-white text-8xl font-bold animate-bounce">
            Round 1
          </h1>
        </div>
      )}

      {roundBanner && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30">
          <h1 className="text-white text-5xl font-bold">{roundBanner}</h1>
        </div>
      )}

      {/* Countdown rechts */}
      {countdown !== null && (
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2 bg-slate-800/90 backdrop-blur-sm rounded-lg p-6 z-10">
          <div className="text-center">
            <h3 className="text-white font-semibold text-lg mb-2">Zeit</h3>
            <div className="text-4xl font-bold text-red-500">{countdown}</div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-10">
        <button
          onClick={startRound}
          disabled={isRoundActive || gamePhase !== "idle"}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg ${
            isRoundActive || gamePhase !== "idle"
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-500 text-white"
          }`}
        >
          {isRoundActive || gamePhase !== "idle"
            ? "Runde läuft..."
            : "Runde Starten"}
        </button>

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
  );
}
