import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcrypt";
import { createSession, uniqueUsername } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, name } = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password and name required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (existing.length) {
      return NextResponse.json({ error: "Account already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [created] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name,
        username: await uniqueUsername(email),
        role: "owner",
        active: true,
      })
      .returning({ id: users.id });
    await createSession(created.id);

    return NextResponse.json({
      ok: true,
      user: { email: email.toLowerCase(), name, role: "owner" },
    });
  } catch (e) {
    console.error("POST /api/auth/signup error:", e);
    return NextResponse.json({ error: "Sign up failed" }, { status: 500 });
  }
}
