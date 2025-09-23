// src/app/api/game/state/route.ts
import { NextResponse } from "next/server";
import { getJwtTokenFromCookie } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

const GAME_BASE = process.env.GAME_SERVICE_BASE_URL ?? "http://localhost:8001";

export async function GET(req: Request) {
  try {
    const token = await getJwtTokenFromCookie();
    if (!token) {
      return NextResponse.json(
        { error: "Missing auth token" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId");
    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    const upstream = await fetch(`${GAME_BASE}/games/${gameId}/state`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const raw = await upstream.text();
    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      // Falls kein JSON zurückkommt, als String weitergeben
      data = raw;
    }

    // <-- Dein gewünschtes Logging
    console.log("[/api/game/state] upstream body:", data);

    if (!upstream.ok) {
      // Upstream-Fehler 1:1 (mit Body) durchreichen
      return NextResponse.json(
        typeof data === "object" ? data : { error: String(data) },
        { status: upstream.status }
      );
    }

    // Erfolgs-Response zurückgeben
    return NextResponse.json(
      typeof data === "object" ? data : { raw: String(data) }
    );
  } catch (e) {
    console.error("Error in /api/game/state:", e);
    return NextResponse.json(
      { error: "Failed to fetch game state" },
      { status: 500 }
    );
  }
}
