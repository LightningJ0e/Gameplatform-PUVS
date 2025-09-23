// src/utils/polling.ts
export type PollerOptions = {
  url: string;
  intervalMs?: number;
  hardTimeoutMs?: number;
  onTick?: (raw: string, data: any, res: Response) => void;
  shouldStop: (raw: string, data: any, res: Response) => boolean;
  onSuccess: (raw: string, data: any, res: Response) => void;
  intervalRef: React.MutableRefObject<number | null>;
  timeoutRef: React.MutableRefObject<number | null>;
  stopFn: () => void;
  onTimeout?: () => void;
  onError?: (err: any) => void;
};

export function createPoller(opts: PollerOptions) {
  const {
    url,
    intervalMs = 200,
    hardTimeoutMs = 30000,
    onTick,
    shouldStop,
    onSuccess,
    intervalRef,
    timeoutRef,
    stopFn,
    onTimeout,
    onError,
  } = opts;

  if (intervalRef.current) return; // schon aktiv

  timeoutRef.current = window.setTimeout(() => {
    console.warn(`[poll] hard-timeout reached for ${url}`);
    onTimeout?.();
    stopFn();
  }, hardTimeoutMs);

  intervalRef.current = window.setInterval(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const raw = await res.text();
      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        /* raw bleibt Text */
      }

      onTick?.(raw, data, res);

      if (res.ok && shouldStop(raw, data, res)) {
        stopFn();
        onSuccess(raw, data, res);
      }
    } catch (err) {
      console.warn("[poll] tick error:", err);
      onError?.(err);
      // nächster Tick versucht erneut
    }
  }, intervalMs);
}

export function stopPoll(
  intervalRef: React.MutableRefObject<number | null>,
  timeoutRef: React.MutableRefObject<number | null>
) {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
}
