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
  const [currentRound, setCurrentRound] = useState(1);
  const [roundBanner, setRoundBanner] = useState<string | null>(null);
  const [endBanner, setEndBanner] = useState<string | null>(null);
  const [pageClass, setPageClass] = useState("page-slide-in-from-bottom");

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
  const startedRef = useRef(false); // schützt vor Doppelstart beim Handshake
  const autoNextTimeoutRef = useRef<number | null>(null); // 2s Auto-Start nach Anzeige
  const endTriggeredRef = useRef(false);

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
  const clearAutoNext = () => {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
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

  // Initial: Karten-Flip-Intro + ready + isReady-Polling (für die erste Runde)
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
              startRound(); // startet UI + Countdown
              // nach Start der Runde ist Handshake fertig
              startedRef.current = false;
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
      clearAutoNext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Karte wählen

  // Runde starten (nur UI/Countdown) – Rundenzähler wird erhöht
  const startRound = useCallback(() => {
    if (isRoundActive || gamePhase !== "idle") return;

    setPlayedCard(null);
    setOpponentPlayedCard(null);

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

  // Server-Handshake für *jede weitere* Runde: /ready -> isready -> startRound
  const startNextRound = useCallback(async () => {
    if (startedRef.current) return; // vermeidet Doppel-Handshake
    const id =
      gameId ??
      (typeof window !== "undefined" ? sessionStorage.getItem("gameId") : null);
    if (!id) return;

    try {
      startedRef.current = true;
      await apiReady(id);
      clearIsReady();
      isReadyIntRef.current = window.setInterval(async () => {
        try {
          const rsp = await fetch(
            `/api/game/isready?gameId=${encodeURIComponent(id)}`
          );
          if (!rsp.ok) return;
          const data = await rsp.json();
          if (data?.message === "ready") {
            clearIsReady();
            startRound();
            // UI-Phase starten
            startedRef.current = false;
          }
        } catch {}
      }, 300);
    } catch (e) {
      console.error("apiReady (next round) failed:", e);
      startedRef.current = false;
    }
  }, [gameId]);

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

            // Banner nach 2 Sekunden anzeigen, 1 Sekunde sichtbar, danach Karten leeren
            setTimeout(() => {
              setRoundBanner(
                `Round ${roundNo}: ${winnerName} ${
                  winnerName === "draw" ? "" : "won"
                }`
              );
              setCurrentRound(roundNo + 1);
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

  // *** NEU: Auto-Weiterstart 2s nachdem Banner weg ist UND beide Karten null sind ***
  useEffect(() => {
    // Bedingungen: keine Runde aktiv, Phase idle, kein Banner, beide Karten null
    if (
      !isRoundActive &&
      gamePhase === "idle" &&
      roundBanner === null &&
      playedCard === null &&
      opponentPlayedCard === null
    ) {
      clearAutoNext();
      autoNextTimeoutRef.current = window.setTimeout(() => {
        // Handshake + Start der nächsten Runde
        startNextRound();
      }, 2000);
    } else {
      // wenn eine Bedingung nicht passt, anstehendes Autostart-Timeout abbrechen
      clearAutoNext();
    }

    return () => {
      // beim Dependency-Wechsel das evtl. gesetzte Timeout räumen
      clearAutoNext();
    };
  }, [
    isRoundActive,
    gamePhase,
    roundBanner,
    playedCard,
    opponentPlayedCard,
    startNextRound,
  ]);

  // Home
  const navigateBackToHome = useCallback(
    (endResult?: "win" | "lose") => {
      // wenn mit Ergebnis: erst Banner, dann zurück
      if (endResult) {
        if (endTriggeredRef.current) return; // mehrfach-Trigger verhindern
        endTriggeredRef.current = true;

        // alle laufenden Zeitgeber stoppen
        clearAutoNext();
        clearIsReady();
        clearResultPoll();

        // UI einfrieren
        setIsRoundActive(false);
        setGamePhase("idle");

        // Banner anzeigen
        setEndBanner(endResult === "win" ? "You won!" : "You lost!");

        // nach 2s zurück zur Home
        window.setTimeout(() => {
          setEndBanner(null);
          resetGame();
          setPageClass("page-slide-out-up");
          router.push("/");
        }, 2000);
        return;
      }

      // Standard: sofort zurück
      resetGame();
      setPageClass("page-slide-out-up");
      router.push("/");
    },
    [
      clearAutoNext,
      clearIsReady,
      clearResultPoll,
      resetGame,
      router,
      setGamePhase,
      setIsRoundActive,
    ]
  );

  useEffect(() => {
    if (endTriggeredRef.current) return;

    if (playerHearts <= 0 || opponentHearts <= 0) {
      const iWin = playerHearts > 0 && opponentHearts <= 0;
      navigateBackToHome(iWin ? "win" : "lose");
    }
  }, [playerHearts, opponentHearts, navigateBackToHome]);

  return (
    <div
      className={`h-screen bg-slate-900 relative overflow-hidden text-white flex flex-col justify-center ${pageClass}`}
    >
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
                onClick={() => setSelectedCardIndex(index)}
              />
            </div>
          ))}
        </div>
      </div>
      {endBanner && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
          <h1 className="text-white text-6xl font-extrabold">{endBanner}</h1>
        </div>
      )}

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
            Round: {currentRound}
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
            <h3 className="text-white font-semibold text-lg mb-2">Time</h3>
            <div className="text-4xl font-bold text-red-500">{countdown}</div>
          </div>
        </div>
      )}
    </div>
  );
}
