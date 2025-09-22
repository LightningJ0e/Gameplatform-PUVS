import { NextResponse } from "next/server";

const USER_BASE = process.env.USER_BASE_URL ?? "http://localhost:8000";

export async function GET() {
  console.log("API /users/bot: GET request started");

  try {
    console.log(
      "API /users/bot: Calling UserService at",
      `${USER_BASE}/getBotInfo`
    );

    const response = await fetch(`${USER_BASE}/getBotInfo`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    console.log(
      "API /users/bot: UserService response status:",
      response.status
    );

    let botData: any;
    try {
      botData = await response.json();
      console.log("API /users/bot: UserService JSON payload:", botData);
    } catch (e) {
      console.log("API /users/bot: Failed to parse JSON, getting text");
      const text = await response.text();
      botData = { detail: text || "Unknown error" };
      console.log("API /users/bot: UserService text payload:", botData);
    }

    if (!response.ok) {
      console.log(
        "API /users/bot: UserService returned error status:",
        response.status
      );
      return NextResponse.json(botData, { status: response.status });
    }

    console.log("API /users/bot: Success, returning bot data:", botData);
    return NextResponse.json(botData, { status: 200 });
  } catch (error: any) {
    console.log("API /users/bot: Network/fetch error:", error.message);
    return NextResponse.json(
      { detail: "Failed to connect to user service" },
      { status: 502 }
    );
  }
}
