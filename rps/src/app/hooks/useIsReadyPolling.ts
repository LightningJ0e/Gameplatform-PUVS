// src/hooks/useIsReadyPolling.ts
"use client";

import { useRef, useEffect } from "react";
import { createPoller, stopPoll } from "@/utils/polling";

export function useIsReadyPolling(onReady: () => void) {
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  function stop() {
    stopPoll(intervalRef, timeoutRef);
  }

  function start(gameId: string) {
    createPoller({
      url: `/api/game/isready?gameId=${encodeURIComponent(gameId)}`,
      intervalMs: 200,
      hardTimeoutMs: 30000,
      intervalRef,
      timeoutRef,
      stopFn: stop,
      onTick: (_raw, data) => console.log("isready poll:", data),
      shouldStop: (_raw, data) =>
        data?.message === "ready" ||
        data?.ready === true ||
        data?.canStart === true ||
        data?.status === "ready",
      onSuccess: () => onReady(),
      onTimeout: () => console.warn("isReady polling timed out"),
    });
  }

  useEffect(() => stop, []);

  return { startIsReadyPolling: start, stopIsReadyPolling: stop };
}
