import { NextResponse } from "next/server";
import { getJwtTokenFromCookie } from "@/app/lib/auth";

const MATCHMAKING_BASE =
  process.env.MATCHMAKING_BASE_URL ?? "http://localhost:8002";

export async function POST() {
  console.log("API /matchmaking/queue: POST request started");

  const token = await getJwtTokenFromCookie();

  if (!token) {
    console.log("API /matchmaking/queue: No valid token found, returning 401");
    return NextResponse.json(
      { detail: "Missing or invalid auth token" },
      { status: 401 }
    );
  }

  try {
    console.log(
      "API /matchmaking/queue: Calling MatchmakingService at",
      `${MATCHMAKING_BASE}/queue/add`
    );

    const queueUrl = new URL(`${MATCHMAKING_BASE}/queue/add`);
    queueUrl.searchParams.set("token", token);
    console.log(
      "API /matchmaking/queue: Full URL with token:",
      queueUrl.toString()
    );

    const upstream = await fetch(queueUrl.toString(), {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    });

    console.log(
      "API /matchmaking/queue: MatchmakingService response status:",
      upstream.status
    );

    let payload: any;
    try {
      payload = await upstream.json();
      console.log(
        "API /matchmaking/queue: MatchmakingService JSON payload:",
        payload
      );
    } catch (e) {
      console.log("API /matchmaking/queue: Failed to parse JSON, getting text");
      const text = await upstream.text();
      payload = { detail: text || "Unknown error" };
      console.log(
        "API /matchmaking/queue: MatchmakingService text payload:",
        payload
      );
    }

    if (!upstream.ok) {
      console.log(
        "API /matchmaking/queue: MatchmakingService returned error status:",
        upstream.status
      );
      return NextResponse.json(payload, { status: upstream.status });
    }

    console.log("API /matchmaking/queue: Successfully joined queue");
    return NextResponse.json(payload, { status: 200 });
  } catch (error: any) {
    console.log("API /matchmaking/queue: Network/fetch error:", error.message);
    return NextResponse.json(
      { detail: "Failed to connect to matchmaking service" },
      { status: 502 }
    );
  }
}
