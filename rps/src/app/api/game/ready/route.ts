import { NextResponse } from "next/server";
import { getJwtTokenFromCookie } from "@/app/lib/auth";

const GAME_BASE = process.env.GAME_SERVICE_BASE_URL ?? "http://localhost:8001";

export async function POST(req: Request) {
  try {
    const token = await getJwtTokenFromCookie();
    if (!token) {
      return NextResponse.json(
        { error: "Missing auth token" },
        { status: 401 }
      );
    }

    const { gameId } = await req.json().catch(() => ({}));
    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${GAME_BASE}/games/${gameId}/ready`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // falls Backend einen Body erwartet (z.B. {ready:true})
      body: JSON.stringify({ ready: true }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            data?.error ?? `Game service responded with status: ${res.status}`,
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in ready API:", error);
    return NextResponse.json(
      { error: "Failed to mark player as ready" },
      { status: 500 }
    );
  }
}
