// src/app/api/game/move/route.ts
import { NextResponse } from "next/server";
import { getJwtTokenFromCookie } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

const GAME_BASE = process.env.GAME_SERVICE_BASE_URL ?? "http://localhost:8001";

type Body = { gameId?: string; action?: number };

export async function POST(req: Request) {
  try {
    const token = await getJwtTokenFromCookie();
    if (!token) {
      return NextResponse.json(
        { error: "Missing auth token" },
        { status: 401 }
      );
    }

    const { gameId, action } = (await req.json()) as Body;

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }
    if (action === undefined || action < 0 || action > 2) {
      return NextResponse.json(
        { error: "Invalid action. Use 0=rock, 1=paper, 2=scissors." },
        { status: 400 }
      );
    }

    console.log("[/api/game/move] → upstream", { gameId, action });

    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 10_000);

    const upstream = await fetch(`${GAME_BASE}/games/${gameId}/move`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ action }),
      signal: ac.signal,
      cache: "no-store",
    }).finally(() => clearTimeout(to));

    const text = await upstream.text();
    const data = text
      ? (() => {
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        })()
      : null;

    console.log("[/api/game/move] ← upstream", upstream.status);

    if (!upstream.ok) {
      return NextResponse.json(
        data ?? { error: `Upstream ${upstream.status}` },
        { status: upstream.status }
      );
    }

    // 204 / leerer Body -> ack
    return NextResponse.json(data ?? { ok: true }, { status: 200 });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      return NextResponse.json({ error: "Upstream timeout" }, { status: 504 });
    }
    console.error("Error in /api/game/move:", e);
    return NextResponse.json(
      { error: "Failed to submit move" },
      { status: 500 }
    );
  }
}
