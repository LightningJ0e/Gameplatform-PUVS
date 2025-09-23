import { NextResponse } from "next/server";
import { z } from "zod";

const LoginReq = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

interface LoginResponse {
  access_token: string;
  token_type?: string;
  [key: string]: unknown; // erlaubt zusätzliche Felder
}

const USER_BASE = process.env.USER_BASE_URL ?? "http://localhost:8000";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "auth";
const ONE_HOUR = 60 * 60;

export async function POST(req: Request) {
  try {
    console.log("Login API: Starting login process");

    // 1) JSON vom Frontend lesen + validieren
    const body = await req.json();
    const data = LoginReq.parse(body);
    console.log("Login API: Parsed login data for username:", data.username);

    // 2) In x-www-form-urlencoded konvertieren (wie UserService es erwartet)
    const form = new URLSearchParams();
    form.set("username", data.username);
    form.set("password", data.password);

    // 3) UserService login call
    console.log("Login API: Calling UserService at", `${USER_BASE}/login`);
    const upstream = await fetch(`${USER_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: form.toString(),
    });

    console.log("Login API: UserService response status:", upstream.status);

    // 4) Response verarbeiten
    let payload: LoginResponse | { detail: string } | null = null;
    try {
      payload = await upstream.json();
      console.log("Login API: UserService payload:", payload);
    } catch {
      console.log("Login API: Failed to parse JSON, trying text");
      const text = await upstream.text();
      payload = text ? { detail: text } : { detail: "Unknown error" };
      console.log("Login API: Text payload:", payload);
    }

    if (!upstream.ok) {
      console.log("Login API: Login failed with status", upstream.status);
      return NextResponse.json(payload, { status: upstream.status });
    }

    // 5) JWT Token aus Response extrahieren
    if (!payload || "detail" in payload) {
      console.log("Login API: Invalid payload or error response");
      return NextResponse.json(
        { detail: "Invalid response from authentication service" },
        { status: 500 }
      );
    }

    const { token_type = "Bearer", access_token } = payload;
    if (!access_token) {
      console.log("Login API: No access_token in response");
      return NextResponse.json(
        { detail: "No access token received" },
        { status: 500 }
      );
    }

    console.log("Login API: Setting cookie with token");

    // 6) HttpOnly-Cookie setzen
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
    });

    response.cookies.set(COOKIE_NAME, `${token_type} ${access_token}`, {
      httpOnly: true,
      secure: false, // Force false for development
      sameSite: "lax",
      path: "/",
      maxAge: ONE_HOUR,
    });

    console.log("Login API: Login successful, cookie set");
    return response;
  } catch (err) {
    console.log("Login API: Error:", err);

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
