import { NextResponse } from "next/server";

const BASE = process.env.LEADERBOARD_BASE_URL ?? "http://localhost:8003";

type UpstreamEntry = {
  username: string;
  games_played: number;
  games_won: number;
  elo: number;
  winrate: number;
  rank: number;
  picture?: string | null;
};

type Player = {
  id: number;
  username: string;
  score: number;
  picture?: string | null;
};

// optional, verhindert Caching bei Next.js Routen
export const dynamic = "force-dynamic";

function normalizePicture(p?: string | null): string | undefined {
  if (!p) return undefined;
  // Whitespaces/Zeilenumbrüche entfernen
  const clean = p.replace(/\s+/g, "");

  // Falls bereits eine data:-URL, so lassen
  if (clean.startsWith("data:image/")) return clean;

  // Einfache Heuristik fürs MIME-Type
  // JPEG beginnt oft mit /9j..., PNG mit iVBORw0KG...
  let mime = "image/png";
  const head = clean.slice(0, 10);
  if (head.startsWith("/9j")) mime = "image/jpeg";
  else if (head.startsWith("iVBORw0KG")) mime = "image/png";

  return `data:${mime};base64,${clean}`;
}

export async function GET() {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 10_000);

  try {
    const upstream = await fetch(`${BASE}/leaderboard/elo`, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: ac.signal,
      cache: "no-store",
    });
    clearTimeout(to);

    let payload: UpstreamEntry[] | { detail?: string };
    try {
      payload = await upstream.json();
    } catch {
      return NextResponse.json(
        { detail: "Invalid upstream JSON" },
        { status: 502 }
      );
    }

    if (!upstream.ok) {
      // Fehler vom Service durchreichen
      return NextResponse.json(payload, { status: upstream.status });
    }

    // Map: rank -> id, elo -> score, picture normalisieren
    const players: Player[] = (payload as UpstreamEntry[]).map((e) => ({
      id: e.rank,
      username: e.username,
      score: e.elo,
      picture: normalizePicture(e.picture),
    }));

    return NextResponse.json(players, { status: 200 });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      return NextResponse.json({ detail: "Gateway timeout" }, { status: 504 });
    }
    return NextResponse.json({ detail: "Proxy error" }, { status: 502 });
  }
}
