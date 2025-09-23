// src/app/api/game/isready/route.ts
import { NextResponse } from "next/server";
import { getJwtTokenFromCookie } from "@/app/lib/auth";

export const dynamic = "force-dynamic"; // verhindert statisches Caching

const GAME_BASE = process.env.GAME_SERVICE_BASE_URL ?? "http://localhost:8001";

// Hilfsfunktionen: robust & typisiert
function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

async function parseJsonSafely(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    try {
      const txt = await res.text();
      return txt ? { detail: txt } : null;
    } catch {
      return null;
    }
  }
}

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

    // Upstream-Request
    const res = await fetch(`${GAME_BASE}/games/${gameId}/isready`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    // JSON (oder Text) robust lesen und in ein Objekt normalisieren
    const raw = await parseJsonSafely(res);
    const data: Record<string, unknown> = isObject(raw)
      ? raw
      : raw == null
      ? {}
      : { value: raw };

    // Logging
    console.log(`[isready API] gameId=${gameId}`, {
      status: res.status,
      body: data,
    });

    if (!res.ok) {
      const msg =
        (isObject(raw) && typeof raw.detail === "string" && raw.detail) ||
        (isObject(raw) && typeof raw.error === "string" && raw.error) ||
        `Upstream ${res.status}`;
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (e: unknown) {
    console.error("Error in isready API:", e);
    return NextResponse.json(
      { error: "Failed to check isready" },
      { status: 500 }
    );
  }
}
