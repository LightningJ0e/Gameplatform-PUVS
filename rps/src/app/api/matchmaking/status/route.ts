import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const MATCHMAKING_BASE =
  process.env.MATCHMAKING_BASE_URL ?? "http://localhost:8002";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "auth";

async function getJwtTokenFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(COOKIE_NAME);

    if (!authCookie?.value) {
      console.log("API /matchmaking/status: No auth cookie found");
      return null;
    }

    const cookieValue = authCookie.value;

    // Cookie format: "Bearer <token>" or "bearer <token>"
    if (cookieValue.toLowerCase().startsWith("bearer ")) {
      const token = cookieValue.slice(7); // Remove "Bearer " or "bearer " prefix
      return token;
    }

    console.log("API /matchmaking/status: Cookie doesn't start with 'Bearer '");
    return null;
  } catch (error) {
    console.log("API /matchmaking/status: Error reading cookie:", error);
    return null;
  }
}

export async function GET() {
  console.log("API /matchmaking/status: GET request started");

  const token = await getJwtTokenFromCookie();

  if (!token) {
    console.log("API /matchmaking/status: No valid token found, returning 401");
    return NextResponse.json(
      { detail: "Missing or invalid auth token" },
      { status: 401 }
    );
  }

  try {
    console.log(
      "API /matchmaking/status: Calling MatchmakingService at",
      `${MATCHMAKING_BASE}/player_queue_info/get_info`
    );

    const statusUrl = new URL(`${MATCHMAKING_BASE}/player_queue_info/get_info`);
    statusUrl.searchParams.set("player_token", token);

    const upstream = await fetch(statusUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    console.log(
      "API /matchmaking/status: MatchmakingService response status:",
      upstream.status
    );

    let payload: any;
    try {
      payload = await upstream.json();
      console.log(
        "API /matchmaking/status: MatchmakingService JSON payload:",
        payload
      );
    } catch (e) {
      console.log(
        "API /matchmaking/status: Failed to parse JSON, getting text"
      );
      const text = await upstream.text();
      payload = { detail: text || "Unknown error" };
      console.log(
        "API /matchmaking/status: MatchmakingService text payload:",
        payload
      );
    }

    if (!upstream.ok) {
      console.log(
        "API /matchmaking/status: MatchmakingService returned error status:",
        upstream.status
      );
      return NextResponse.json(payload, { status: upstream.status });
    }

    console.log("API /matchmaking/status: Successfully got queue status");
    return NextResponse.json(payload, { status: 200 });
  } catch (error: any) {
    console.log("API /matchmaking/status: Network/fetch error:", error.message);
    return NextResponse.json(
      { detail: "Failed to connect to matchmaking service" },
      { status: 502 }
    );
  }
}
