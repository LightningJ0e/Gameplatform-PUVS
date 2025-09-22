import { NextResponse } from "next/server";

const USER_BASE = process.env.USER_BASE_URL ?? "http://localhost:8000";
const LEADERBOARD_BASE =
  process.env.LEADERBOARD_BASE_URL ?? "http://localhost:8003";

export async function POST(req: Request) {
  console.log("API /users/by-token: POST request started");

  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      console.log("API /users/by-token: No token provided in request body");
      return NextResponse.json(
        { detail: "Missing token in request body" },
        { status: 400 }
      );
    }

    console.log("API /users/by-token: Token provided, calling UserService");

    // Fetch user data from UserService using the provided token
    const userResponse = await fetch(`${USER_BASE}/getUserInfo`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(
      "API /users/by-token: UserService response status:",
      userResponse.status
    );

    let userData: any;
    try {
      userData = await userResponse.json();
      console.log("API /users/by-token: UserService JSON payload:", userData);
    } catch (e) {
      console.log("API /users/by-token: Failed to parse JSON, getting text");
      const text = await userResponse.text();
      userData = { detail: text || "Unknown error" };
      console.log("API /users/by-token: UserService text payload:", userData);
    }

    if (!userResponse.ok) {
      console.log(
        "API /users/by-token: UserService returned error status:",
        userResponse.status
      );
      return NextResponse.json(userData, { status: userResponse.status });
    }

    console.log(
      "API /users/by-token: UserService success, now fetching rank data"
    );

    // Fetch rank data from LeaderboardService using the same token
    let rankData = null;
    try {
      console.log("API /users/by-token: Calling LeaderboardService for rank");
      const rankUrl = new URL(`${LEADERBOARD_BASE}/leaderboard/specificRank`);
      rankUrl.searchParams.set("token", token);

      const rankResponse = await fetch(rankUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      console.log(
        "API /users/by-token: LeaderboardService response status:",
        rankResponse.status
      );

      if (rankResponse.ok) {
        rankData = await rankResponse.json();
        console.log(
          "API /users/by-token: LeaderboardService rank data:",
          rankData
        );
      } else {
        console.log(
          "API /users/by-token: LeaderboardService failed, using default rank 0"
        );
        rankData = { rank: 0 };
      }
    } catch (error: any) {
      console.log(
        "API /users/by-token: LeaderboardService error:",
        error.message
      );
      rankData = { rank: 0 };
    }

    // Combine user data with rank data and include the token
    const combinedData = {
      ...userData,
      rank: rankData?.rank ?? 0,
      token: token, // Include the token in the response for the OpponentContext
    };

    console.log(
      "API /users/by-token: Success, returning combined user data:",
      combinedData
    );
    return NextResponse.json(combinedData, { status: 200 });
  } catch (error: any) {
    console.log("API /users/by-token: Network/fetch error:", error.message);
    return NextResponse.json(
      { detail: "Failed to process request" },
      { status: 500 }
    );
  }
}
