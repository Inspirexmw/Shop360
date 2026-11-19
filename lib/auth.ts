import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "shop360_session";
const SESSION_DAYS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ tokenHash: hashToken(token), userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

// Returns the signed-in user row (active only) or null.
export async function currentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const u = rows[0]?.user;
  if (!u || !u.active) return null;
  return u;
}

export async function revokeOtherSessions(userId: string, keepToken: string | undefined) {
  const keep = keepToken ? hashToken(keepToken) : "";
  await db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.tokenHash, keep)));
}

export async function currentToken() {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export function publicUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    username: u.username ?? "",
    phone: u.phone ?? "",
    role: u.role,
    avatar: u.avatar ?? null,
    preferences: (u.preferences ?? {}) as Record<string, unknown>,
  };
}

// Derives a free username from an email local part (lowercase, a-z 0-9 . _ -).
export async function uniqueUsername(email: string) {
  const base = (email.split("@")[0] || "user").toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 24) || "user";
  let candidate = base;
  for (let i = 2; i < 1000; i++) {
    const taken = await db.select({ id: users.id }).from(users).where(eq(users.username, candidate)).limit(1);
    if (!taken.length) return candidate;
    candidate = `${base}${i}`;
  }
  return `${base}${randomBytes(3).toString("hex")}`;
}
