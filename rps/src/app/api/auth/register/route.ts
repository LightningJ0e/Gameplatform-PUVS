import { NextResponse } from "next/server";
import { z } from "zod";

const RegisterReq = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const USER_BASE = process.env.USER_BASE_URL ?? "http://localhost:8000";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "auth";
const ONE_HOUR = 60 * 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = RegisterReq.parse(body);

    // 1) Registrierung anstoßen (JSON → dein Service akzeptiert das bereits)
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 10_000);

    const reg = await fetch(`${USER_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: ac.signal,
    });

    clearTimeout(to);

    // Payload robust lesen
    let regPayload: any = null;
    try {
      regPayload = await reg.json();
    } catch {
      const txt = await reg.text();
      regPayload = txt ? { detail: txt } : null;
    }

    if (!reg.ok) {
      // z.B. {detail:"User already exists"}
      return NextResponse.json(regPayload, { status: reg.status });
    }

    // 2) Versuchen, Token aus /register zu ziehen
    let token = regPayload?.access_token ?? regPayload?.token ?? null;
    let tokenType = regPayload?.token_type ?? "Bearer";

    // 3) Falls kein Token geliefert wird → automatisch login
    if (!token) {
      const form = new URLSearchParams();
      form.set("username", data.username);
      form.set("password", data.password);

      const ac2 = new AbortController();
      const to2 = setTimeout(() => ac2.abort(), 10_000);

      const login = await fetch(`${USER_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
        signal: ac2.signal,
      });

      clearTimeout(to2);

      let loginPayload: any = null;
      try {
        loginPayload = await login.json();
      } catch {
        const txt = await login.text();
        loginPayload = txt ? { detail: txt } : null;
      }

      if (!login.ok) {
        // Registrierung ok, aber Auto-Login scheitert → Frontend bekommt Info
        return NextResponse.json(
          {
            detail: "Registered, but auto-login failed",
            loginError: loginPayload?.detail ?? null,
          },
          { status: 202 } // Accepted
        );
      }

      token = loginPayload?.access_token ?? loginPayload?.token ?? null;
      tokenType = loginPayload?.token_type ?? "Bearer";
      if (!token) {
        return NextResponse.json(
          { detail: "Token missing after auto-login" },
          { status: 502 }
        );
      }
    }

    // 4) HttpOnly-Cookie setzen
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, `${tokenType} ${token}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ONE_HOUR,
    });
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    if ((err as any)?.name === "AbortError") {
      return NextResponse.json({ error: "Gateway timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "Proxy error" }, { status: 502 });
  }
}
