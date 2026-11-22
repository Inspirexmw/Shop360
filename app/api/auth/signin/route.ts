import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcrypt";
import { createSession } from "@/lib/auth";
import { recordAudit, tooManyFailedLogins } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const emailKey = email.trim().toLowerCase();
    if (await tooManyFailedLogins(emailKey)) {
      return NextResponse.json({ error: "Too many failed sign-in attempts. Try again in 15 minutes." }, { status: 429 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, emailKey))
      .limit(1);

    if (!user.length) {
      await recordAudit(
        { action: "auth.sign_in_failed", entityType: "user", summary: "Failed sign-in: unknown email", intent: "auth" },
        { id: "", email: emailKey, name: "", role: "" },
      );
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const u = user[0];
    if (!u.active) {
      await recordAudit(
        { action: "auth.sign_in_failed", entityType: "user", entityId: u.id, summary: "Failed sign-in: disabled account", intent: "auth" },
        { id: u.id, email: u.email, name: u.name, role: u.role, username: u.username },
      );
      return NextResponse.json({ error: "Account is disabled" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, u.passwordHash);
    if (!valid) {
      await recordAudit(
        { action: "auth.sign_in_failed", entityType: "user", entityId: u.id, summary: "Failed sign-in: wrong password", intent: "auth" },
        { id: u.id, email: u.email, name: u.name, role: u.role, username: u.username },
      );
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession(u.id);
    await recordAudit(
      { action: "auth.sign_in", entityType: "session", entityId: u.id, summary: "Signed in", intent: "auth" },
      { id: u.id, email: u.email, name: u.name, role: u.role, username: u.username },
    );
    return NextResponse.json({
      ok: true,
      user: { id: u.id, email: u.email, name: u.name, role: u.role, username: u.username },
    });
  } catch (e) {
    console.error("POST /api/auth/signin error:", e);
    return NextResponse.json({ error: "Sign in failed" }, { status: 500 });
  }
}
