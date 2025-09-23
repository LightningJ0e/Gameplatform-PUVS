// src/services/gameApi.ts
export async function apiReady(gameId: string) {
  const res = await fetch("/api/game/ready", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId }),
  });
  const data = await res.json().catch(() => ({}));
  console.log("apiReady data:", data);
  if (!res.ok) throw new Error(data?.error ?? res.status);
  return data;
}

export async function apiIsReady(gameId: string) {
  const res = await fetch(
    `/api/game/isready?gameId=${encodeURIComponent(gameId)}`,
    { cache: "no-store" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? res.status);
  return data;
}

export async function apiMove(gameId: string, action: number) {
  // dein move-Proxy erwartet { action }, nicht { move }
  const res = await fetch("/api/game/move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, action }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? res.status);
  return data;
}

export async function apiGameState(gameId: string) {
  const res = await fetch(
    `/api/game/state?gameId=${encodeURIComponent(gameId)}`,
    { cache: "no-store" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? res.status);
  return data;
}
