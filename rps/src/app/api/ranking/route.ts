import { NextResponse } from "next/server";

const BASE = process.env.LEADERBOARD_BASE_URL ?? "http://localhost:8003";

type UpstreamEntry = {
  username: string;
  games_played: number;
  games_won: number;
  elo: number;
  winrate: number;
  rank: number;
};

type Player = {
  id: number;
  username: string;
  score: number;
  profileImage?: string | null;
};

export async function GET() {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 10_000);

  try {
    const upstream = await fetch(`${BASE}/leaderboard/elo`, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: ac.signal,
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

    // Map: rank -> id, elo -> score
    const players: Player[] = (payload as UpstreamEntry[]).map((e) => ({
      id: e.rank,
      username: e.username,
      score: e.elo,
      profileImage: null, // falls du später Avatare hast, hier einsetzen
    }));

    return NextResponse.json(players, { status: 200 });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      return NextResponse.json({ detail: "Gateway timeout" }, { status: 504 });
    }
    return NextResponse.json({ detail: "Proxy error" }, { status: 502 });
  }
}
