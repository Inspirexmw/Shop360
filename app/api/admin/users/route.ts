import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { users } from "@/db/schema";
import { currentUser, uniqueUsername } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { sendAccountCreatedEmail } from "@/lib/email";
import { getRoleDefinitions } from "@/lib/role-store";
import { isRoleKey, normalizeRole } from "@/lib/roles";

async function requireOwner() {
  const user = await currentUser();
  if (!user) return { status: 401 as const, error: "Sign in required" };
  if (normalizeRole(user.role) !== "owner") return { status: 403 as const, error: "Owner access required" };
  return { user };
}

function publicUser(u: typeof users.$inferSelect, keys: string[]) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    username: u.username ?? "",
    role: normalizeRole(u.role, keys),
    active: u.active,
    createdAt: u.createdAt,
  };
}

export async function GET() {
  const auth = await requireOwner();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const defs = await getRoleDefinitions();
    const keys = defs.map((d) => d.key);
    const rows = await db.select().from(users).orderBy(users.createdAt);
    return NextResponse.json({ users: rows.map((u) => publicUser(u, keys)), roleLabels: Object.fromEntries(defs.map((d) => [d.key, d.label])) });
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
    const defs = await getRoleDefinitions();
    const keys = defs.map((d) => d.key);
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
    if (!isRoleKey(role, keys)) {
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

    const createdUser = publicUser(created, keys);
    await recordAudit(
      {
        action: "users.create",
        entityType: "users",
        entityId: createdUser.id,
        summary: `Created ${createdUser.role} account for ${createdUser.email}`,
        after: { email: createdUser.email, name: createdUser.name, role: createdUser.role, active: createdUser.active },
        intent: "users",
      },
      { id: auth.user.id, email: auth.user.email, name: auth.user.name, role: auth.user.role, username: auth.user.username },
    );
    const emailResult = await sendAccountCreatedEmail({
      name: createdUser.name,
      email: createdUser.email,
      password,
      role: createdUser.role,
      roleLabel: defs.find((d) => d.key === createdUser.role)?.label,
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
    const defs = await getRoleDefinitions();
    const keys = defs.map((d) => d.key);
    if (!body.id) return NextResponse.json({ error: "Account id required" }, { status: 400 });
    if (body.role !== undefined && !isRoleKey(body.role, keys)) {
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

    const currentRole = normalizeRole(target.role, keys);
    const nextRole = body.role !== undefined ? body.role : currentRole;
    const nextActive = body.active !== undefined ? body.active : target.active;
    const losingOwner = currentRole === "owner" && (nextRole !== "owner" || !nextActive);
    if (losingOwner) {
      const all = await db.select().from(users).where(eq(users.active, true));
      if (all.filter((u) => normalizeRole(u.role, keys) === "owner").length <= 1) {
        return NextResponse.json({ error: "At least one active owner must remain" }, { status: 409 });
      }
    }

    const [updated] = await db
      .update(users)
      .set({ role: nextRole, active: nextActive, updatedAt: new Date() })
      .where(eq(users.id, target.id))
      .returning();

    const roleChanged = nextRole !== currentRole;
    const statusChanged = nextActive !== target.active;
    const changes: string[] = [];
    if (roleChanged) changes.push(`role ${currentRole} → ${nextRole}`);
    if (statusChanged) changes.push(`active ${target.active} → ${nextActive}`);
    await recordAudit(
      {
        action: roleChanged ? "users.role_changed" : statusChanged ? "users.status_changed" : "users.updated",
        entityType: "users",
        entityId: updated.id,
        summary: `${updated.name}: ${changes.join("; ") || "no changes"}`,
        before: { role: currentRole, active: target.active },
        after: { role: nextRole, active: nextActive },
        intent: "users",
      },
      { id: auth.user.id, email: auth.user.email, name: auth.user.name, role: auth.user.role, username: auth.user.username },
    );

    return NextResponse.json({ ok: true, user: publicUser(updated, keys) });
  } catch (e) {
    console.error("PATCH /api/admin/users error:", e);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
