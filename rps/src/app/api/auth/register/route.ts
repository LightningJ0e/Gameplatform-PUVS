import { NextResponse } from "next/server";
import { z } from "zod";

const RegisterReq = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const USER_BASE = process.env.USER_BASE_URL ?? "http://localhost:8000";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "auth";
const ONE_HOUR = 60 * 60;

// ---- Helper types & guards ----
type MaybeAuthPayload = {
  access_token?: unknown;
  token?: unknown;
  token_type?: unknown;
  detail?: unknown;
} | null;

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function parseJsonSafely(res: Response): Promise<unknown> {
  return res.json().catch(async () => {
    const txt = await res.text().catch(() => "");
    return txt ? { detail: txt } : null;
  });
}

function extractToken(
  data: unknown
): { token: string; tokenType: string } | null {
  if (!isObject(data)) return null;
  const access_token = data.access_token;
  const token = data.token;
  const token_type = data.token_type;

  const tokenStr =
    (typeof access_token === "string" && access_token) ||
    (typeof token === "string" && token) ||
    null;

  if (!tokenStr) return null;

  const tokenType =
    typeof token_type === "string" && token_type ? token_type : "Bearer";
  return { token: tokenStr, tokenType };
}

function extractDetail(data: unknown): string | null {
  if (!isObject(data)) return null;
  const d = data.detail;
  return typeof d === "string" ? d : null;
}

// ---- Handler ----
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = RegisterReq.parse(body);

    // 1) Registrierung (JSON)
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 10_000);

    const reg = await fetch(`${USER_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: ac.signal,
    });

    clearTimeout(to);

    const regPayload = (await parseJsonSafely(reg)) as MaybeAuthPayload;

    if (!reg.ok) {
      // z.B. { detail: "User already exists" }
      return NextResponse.json(regPayload, { status: reg.status });
    }

    // 2) Token aus /register extrahieren
    let tokenInfo = extractToken(regPayload);

    // 3) Falls kein Token → auto login
    if (!tokenInfo) {
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

      const loginPayload = await parseJsonSafely(login);

      if (!login.ok) {
        return NextResponse.json(
          {
            detail: "Registered, but auto-login failed",
            loginError: extractDetail(loginPayload),
          },
          { status: 202 } // Accepted
        );
      }

      tokenInfo = extractToken(loginPayload);
      if (!tokenInfo) {
        return NextResponse.json(
          { detail: "Token missing after auto-login" },
          { status: 502 }
        );
      }
    }

    // 4) HttpOnly-Cookie setzen
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, `${tokenInfo.tokenType} ${tokenInfo.token}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ONE_HOUR,
    });
    return res;
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    // Abort in Node/Edge kann DOMException o.ä. sein → über name prüfen
    const name = (err as { name?: string } | null)?.name;
    if (name === "AbortError") {
      return NextResponse.json({ error: "Gateway timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "Proxy error" }, { status: 502 });
  }
}
