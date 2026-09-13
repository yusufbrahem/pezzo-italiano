import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export { SESSION_COOKIE };
const SESSION_DAYS = 7;

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  role: "owner" | "staff";
}

export async function createSessionCookie(payload: SessionPayload) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * The real authorization check — re-verifies the JWT signature AND confirms
 * the account is still active in the database on every call (so deactivating
 * a staff member takes effect immediately, not just at their next login).
 * Wrapped in React's cache() for per-request memoization: called from many
 * places (every admin page, every Server Action) but only queries the DB
 * once per request.
 */
export const verifySession = cache(async (): Promise<SessionPayload | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const userId = payload.userId as string;
    const rows = await sql`SELECT role, is_active FROM admin_users WHERE id = ${userId}`;
    const user = rows[0];
    if (!user || !user.is_active) return null;
    return { userId, role: user.role as "owner" | "staff" };
  } catch {
    return null;
  }
});

export async function requireSession(): Promise<SessionPayload> {
  const session = await verifySession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireOwner(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "owner") redirect("/admin");
  return session;
}
