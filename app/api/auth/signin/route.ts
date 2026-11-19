import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const u = user[0];
    if (!u.active) {
      return NextResponse.json({ error: "Account is disabled" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, u.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      user: { id: u.id, email: u.email, name: u.name, role: u.role },
    });
  } catch (e) {
    console.error("POST /api/auth/signin error:", e);
    return NextResponse.json({ error: "Sign in failed" }, { status: 500 });
  }
}
