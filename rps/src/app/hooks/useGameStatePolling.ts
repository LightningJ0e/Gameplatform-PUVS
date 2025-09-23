// src/hooks/useGameStatePolling.ts
"use client";

import { useRef, useEffect } from "react";
import { createPoller, stopPoll } from "@/utils/polling";
import type { Card } from "@/utils/cards";
import { MOVE_TO_CARD } from "@/utils/cards";

type RevealPayload = {
  playerMove: Card; // deine Karte
  opponentMove: Card; // Gegnerkarte
  raw?: any;
};
type RevealHandler = (payload: RevealPayload) => void;

/**
 * Pollen den Spielzustand, bis previous_round.status === "complete(d)"
 * und sowohl p1_action als auch p2_action Zahlen (0/1/2) sind.
 * Dann werden beide Karten gemappt und via onReveal zurückgegeben.
 */
export function useGameStatePolling(onReveal: RevealHandler) {
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  function stop() {
    stopPoll(intervalRef, timeoutRef);
  }

  /**
   * getMyLastMove: Liefert deine zuletzt gesendete Aktion (0|1|2) oder null.
   * Damit ordnen wir p1/p2 => "ich" vs "Gegner".
   */
  function start(gameId: string, getMyLastMove?: () => 0 | 1 | 2 | null) {
    createPoller({
      url: `/api/game/state?gameId=${encodeURIComponent(gameId)}`,
      intervalMs: 200,
      hardTimeoutMs: 30000,
      intervalRef,
      timeoutRef,
      stopFn: stop,
      onTick: (_raw, data) => console.log("state poll:", data),
      shouldStop: (_raw, data) => {
        const prev = data?.previous_round;
        if (!prev) return false;
        const status = String(prev.status ?? "").toLowerCase();
        if (!(status === "complete" || status === "completed")) return false;
        const p1 = prev.p1_action,
          p2 = prev.p2_action;
        return [p1, p2].every((v) => typeof v === "number" && v >= 0 && v <= 2);
      },
      onSuccess: (_raw, data) => {
        const prev = data?.previous_round ?? {};
        const p1 = prev?.p1_action as 0 | 1 | 2;
        const p2 = prev?.p2_action as 0 | 1 | 2;

        const myLast = getMyLastMove?.() ?? null;

        let playerMoveNum: 0 | 1 | 2;
        let opponentMoveNum: 0 | 1 | 2;

        if (myLast !== null) {
          if (p1 === myLast) {
            playerMoveNum = p1;
            opponentMoveNum = p2;
          } else if (p2 === myLast) {
            playerMoveNum = p2;
            opponentMoveNum = p1;
          } else {
            // Sicherheitsfallback: Wir kennen "mich" nicht sicher -> nimm myLast als meine Karte,
            // und nimm p1 als Gegner (p1/p2 existieren garantiert).
            playerMoveNum = myLast;
            opponentMoveNum = p1;
          }
        } else {
          // Kein Wissen über "mich": setze deterministisch p1=ich, p2=gegner
          playerMoveNum = p1;
          opponentMoveNum = p2;
        }

        onReveal({
          playerMove: MOVE_TO_CARD[playerMoveNum],
          opponentMove: MOVE_TO_CARD[opponentMoveNum],
          raw: data,
        });
      },
      onTimeout: () => console.warn("state polling timed out"),
    });
  }

  useEffect(() => stop, []);

  return { startGameStatePolling: start, stopGameStatePolling: stop };
}
