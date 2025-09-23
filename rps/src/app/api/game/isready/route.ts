// src/app/api/game/isready/route.ts
import { NextResponse } from "next/server";
import { getJwtTokenFromCookie } from "@/app/lib/auth";

export const dynamic = "force-dynamic"; // verhindert statisches Caching

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

    // Upstream-Request
    const res = await fetch(`${GAME_BASE}/games/${gameId}/isready`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    // Versuch, JSON zu lesen – bei leerem Body leeres Objekt zurückgeben
    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    // 👉 Logging in der Server-Konsole
    console.log(`[isready API] gameId=${gameId}`, {
      status: res.status,
      body: data,
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error ?? `Upstream ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Error in isready API:", e);
    return NextResponse.json(
      { error: "Failed to check isready" },
      { status: 500 }
    );
  }
}
