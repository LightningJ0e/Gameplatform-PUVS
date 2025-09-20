import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

const USER_BASE = process.env.USER_BASE_URL ?? "http://localhost:8000";
const LEADERBOARD_BASE =
  process.env.LEADERBOARD_BASE_URL ?? "http://localhost:8003";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "auth";

async function getJwtTokenFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(COOKIE_NAME);

    if (!authCookie?.value) {
      console.log("API /users/me: No auth cookie found");
      return null;
    }

    const cookieValue = authCookie.value;
    console.log("API /users/me: Raw cookie value:", cookieValue);

    // Cookie format: "Bearer <token>" or "bearer <token>"
    if (cookieValue.toLowerCase().startsWith("bearer ")) {
      const token = cookieValue.slice(7); // Remove "Bearer " or "bearer " prefix
      console.log(
        "API /users/me: Extracted token:",
        token ? "present" : "missing"
      );
      return token;
    }

    console.log("API /users/me: Cookie doesn't start with 'Bearer '");
    return null;
  } catch (error) {
    console.log("API /users/me: Error reading cookie:", error);
    return null;
  }
}

export async function GET() {
  console.log("API /users/me: GET request started");

  const token = await getJwtTokenFromCookie();

  if (!token) {
    console.log("API /users/me: No valid token found, returning 401");
    return NextResponse.json(
      { detail: "Missing or invalid auth token" },
      { status: 401 }
    );
  }

  try {
    console.log(
      "API /users/me: Calling UserService at",
      `${USER_BASE}/getUserInfo`
    );

    const upstream = await fetch(`${USER_BASE}/getUserInfo`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("API /users/me: UserService response status:", upstream.status);

    let payload: any;
    try {
      payload = await upstream.json();
      console.log("API /users/me: UserService JSON payload:", payload);
    } catch (e) {
      console.log("API /users/me: Failed to parse JSON, getting text");
      const text = await upstream.text();
      payload = { detail: text || "Unknown error" };
      console.log("API /users/me: UserService text payload:", payload);
    }

    if (!upstream.ok) {
      console.log(
        "API /users/me: UserService returned error status:",
        upstream.status
      );
      return NextResponse.json(payload, { status: upstream.status });
    }

    console.log("API /users/me: UserService success, now fetching rank data");

    // Fetch rank data from LeaderboardService
    let rankData = null;
    try {
      console.log("API /users/me: Calling LeaderboardService for rank");
      const rankUrl = new URL(`${LEADERBOARD_BASE}/leaderboard/specificRank`);
      rankUrl.searchParams.set("token", token);

      const rankResponse = await fetch(rankUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      console.log(
        "API /users/me: LeaderboardService response status:",
        rankResponse.status
      );

      if (rankResponse.ok) {
        rankData = await rankResponse.json();
        console.log("API /users/me: LeaderboardService rank data:", rankData);
      } else {
        console.log(
          "API /users/me: LeaderboardService failed, using default rank 0"
        );
        rankData = { rank: 0 };
      }
    } catch (error: any) {
      console.log("API /users/me: LeaderboardService error:", error.message);
      rankData = { rank: 0 };
    }

    // Combine user data with rank data
    const combinedData = {
      ...payload,
      rank: rankData?.rank ?? 0,
    };

    console.log(
      "API /users/me: Success, returning combined user data:",
      combinedData
    );
    return NextResponse.json(combinedData, { status: 200 });
  } catch (error: any) {
    console.log("API /users/me: Network/fetch error:", error.message);
    return NextResponse.json(
      { detail: "Failed to connect to user service" },
      { status: 502 }
    );
  }
}

const UsernameReq = z.object({ username: z.string().min(3).max(32) });

export async function PUT(req: Request) {
  const token = await getJwtTokenFromCookie();
  if (!token) {
    return NextResponse.json({ detail: "Missing auth token" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = UsernameReq.parse(body);

    const r = await fetch(`${USER_BASE}/user/rename`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username: data.username }),
    });

    const payload = await r
      .json()
      .catch(async () => ({ detail: await r.text() }));
    if (!r.ok) {
      return NextResponse.json(payload, { status: r.status });
    }

    return NextResponse.json(payload ?? { ok: true }, { status: 200 });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ detail: "Proxy error" }, { status: 502 });
  }
}
