import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { users } from "@/db/schema";
import { uniqueUsername } from "@/lib/auth";

// One-time bootstrap: creates the first owner when the database has no accounts.
// Disabled unless SETUP_KEY is configured on the server.
export async function POST(req: Request) {
  const setupKey = process.env.SETUP_KEY;
  if (!setupKey) return NextResponse.json({ error: "Setup is disabled" }, { status: 404 });

  try {
    const body = (await req.json()) as {
      setupKey?: string;
      email?: string;
      password?: string;
      name?: string;
    };
    if (body.setupKey !== setupKey) {
      return NextResponse.json({ error: "Invalid setup key" }, { status: 401 });
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || password.length < 6) {
      return NextResponse.json({ error: "Name, valid email and password (6+ characters) are required" }, { status: 400 });
    }

    const existing = await db.select({ id: users.id }).from(users).limit(1);
    if (existing.length) {
      return NextResponse.json({ error: "Accounts already exist. Sign in and add staff under Team & access." }, { status: 409 });
    }

    const [created] = await db
      .insert(users)
      .values({
        email,
        name,
        role: "owner",
        passwordHash: await bcrypt.hash(password, 10),
        username: await uniqueUsername(email),
        active: true,
      })
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

    return NextResponse.json({ ok: true, user: created }, { status: 201 });
  } catch (e) {
    console.error("POST /api/setup error:", e);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
