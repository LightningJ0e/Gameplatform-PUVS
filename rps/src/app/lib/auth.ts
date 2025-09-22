import { cookies } from "next/headers";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "auth";

export async function getJwtTokenFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(COOKIE_NAME);

    if (!authCookie?.value) {
      console.log("Auth: No auth cookie found");
      return null;
    }

    const cookieValue = authCookie.value;

    // Cookie format: "Bearer <token>" or "bearer <token>"
    if (cookieValue.toLowerCase().startsWith("bearer ")) {
      const token = cookieValue.slice(7); // Remove "Bearer " or "bearer " prefix
      return token;
    }

    console.log("Auth: Cookie doesn't start with 'Bearer '");
    return null;
  } catch (error) {
    console.log("Auth: Error reading cookie:", error);
    return null;
  }
}
