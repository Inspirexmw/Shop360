import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { users } from "@/db/schema";
import { currentUser, uniqueUsername } from "@/lib/auth";
import { sendAccountCreatedEmail } from "@/lib/email";
import { isRole, normalizeRole } from "@/lib/roles";

async function requireOwner() {
  const user = await currentUser();
  if (!user) return { status: 401 as const, error: "Sign in required" };
  if (normalizeRole(user.role) !== "owner") return { status: 403 as const, error: "Owner access required" };
  return { user };
}

function publicUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    username: u.username ?? "",
    role: normalizeRole(u.role),
    active: u.active,
    createdAt: u.createdAt,
  };
}

export async function GET() {
  const auth = await requireOwner();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const rows = await db.select().from(users).orderBy(users.createdAt);
    return NextResponse.json({ users: rows.map(publicUser) });
  } catch (e) {
    console.error("GET /api/admin/users error:", e);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = (await req.json()) as { email?: string; password?: string; name?: string; role?: string };
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");
    const role = String(body.role ?? "cashier");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    if (!name || name.length > 80) {
      return NextResponse.json({ error: "Enter a name (80 characters or fewer)" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (!isRole(role)) {
      return NextResponse.json({ error: "Choose a valid role" }, { status: 400 });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) {
      return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
    }

    const [created] = await db
      .insert(users)
      .values({
        email,
        name,
        role,
        passwordHash: await bcrypt.hash(password, 10),
        username: await uniqueUsername(email),
        active: true,
      })
      .returning();

    const createdUser = publicUser(created);
    const emailResult = await sendAccountCreatedEmail({
      name: createdUser.name,
      email: createdUser.email,
      password,
      role: createdUser.role,
      createdBy: auth.user.name,
    });

    return NextResponse.json({ ok: true, user: createdUser, email: emailResult }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/users error:", e);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = (await req.json()) as { id?: string; role?: string; active?: boolean };
    if (!body.id) return NextResponse.json({ error: "Account id required" }, { status: 400 });
    if (body.role !== undefined && !isRole(body.role)) {
      return NextResponse.json({ error: "Choose a valid role" }, { status: 400 });
    }
    if (body.active !== undefined && typeof body.active !== "boolean") {
      return NextResponse.json({ error: "Active must be true or false" }, { status: 400 });
    }
    if (body.id === auth.user.id && (body.role !== undefined || body.active !== undefined)) {
      return NextResponse.json({ error: "You cannot change your own role or status" }, { status: 400 });
    }

    const rows = await db.select().from(users).where(eq(users.id, body.id)).limit(1);
    const target = rows[0];
    if (!target) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const nextRole = body.role !== undefined ? body.role : normalizeRole(target.role);
    const nextActive = body.active !== undefined ? body.active : target.active;
    const losingOwner = normalizeRole(target.role) === "owner" && (nextRole !== "owner" || !nextActive);
    if (losingOwner) {
      const all = await db.select().from(users).where(eq(users.active, true));
      if (all.filter((u) => normalizeRole(u.role) === "owner").length <= 1) {
        return NextResponse.json({ error: "At least one active owner must remain" }, { status: 409 });
      }
    }

    const [updated] = await db
      .update(users)
      .set({ role: nextRole, active: nextActive, updatedAt: new Date() })
      .where(eq(users.id, target.id))
      .returning();

    return NextResponse.json({ ok: true, user: publicUser(updated) });
  } catch (e) {
    console.error("PATCH /api/admin/users error:", e);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
