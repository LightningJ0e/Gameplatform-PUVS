import { NextResponse } from "next/server";
import { getJwtTokenFromCookie } from "@/app/lib/auth";

const MATCHMAKING_BASE =
  process.env.MATCHMAKING_BASE_URL ?? "http://localhost:8002";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "auth";

export async function POST() {
  try {
    const token = await getJwtTokenFromCookie();

    const response = await fetch(
      `${MATCHMAKING_BASE}/queue/match_bot?token=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("API /matchmaking/bot: Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
