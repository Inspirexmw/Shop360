import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { currentUser, publicUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ ok: true, user: publicUser(u) });
}

// Updates name, username, email, phone and preferences. Role and avatar are not editable here.
export async function PATCH(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: {
    name?: unknown;
    username?: unknown;
    email?: unknown;
    phone?: unknown;
    preferences?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const patch: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name || name.length > 80) return NextResponse.json({ error: "Full name is required (max 80 characters)" }, { status: 400 });
    patch.name = name;
  }
  if (body.username !== undefined) {
    const username = String(body.username).trim();
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(username))
      return NextResponse.json({ error: "Username must be 3-30 characters: letters, numbers, . _ -" }, { status: 400 });
    patch.username = username;
  }
  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    patch.email = email;
  }
  if (body.phone !== undefined) {
    const phone = String(body.phone).trim();
    if (phone.length > 30 || (phone && !/^[+0-9 ()-]*$/.test(phone)))
      return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 });
    patch.phone = phone || null;
  }
  if (body.preferences !== undefined) {
    if (!body.preferences || typeof body.preferences !== "object" || Array.isArray(body.preferences))
      return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
    const incoming = body.preferences as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...((me.preferences as Record<string, unknown>) ?? {}) };
    if (incoming.theme !== undefined) {
      if (!["light", "dark"].includes(String(incoming.theme)))
        return NextResponse.json({ error: "Theme must be light or dark" }, { status: 400 });
      merged.theme = incoming.theme;
    }
    patch.preferences = merged;
  }

  const changed = Object.keys(patch).filter((k) => k !== "updatedAt");

  try {
    const [updated] = await db.update(users).set(patch).where(eq(users.id, me.id)).returning();
    await recordAudit(
      {
        action: "account.updated",
        entityType: "user",
        entityId: me.id,
        summary: changed.length ? `Updated ${changed.join(", ")}` : "Account settings saved",
        before: Object.fromEntries(changed.map((k) => [k, me[k as keyof typeof me]])),
        after: Object.fromEntries(changed.map((k) => [k, updated[k as keyof typeof updated]])),
        intent: "auth",
      },
      { id: me.id, email: me.email, name: me.name, role: me.role, username: me.username },
    );
    return NextResponse.json({ ok: true, user: publicUser(updated) });
  } catch (e) {
    const err = e as { code?: string; cause?: { code?: string } };
    const code = err?.code ?? err?.cause?.code;
    if (code === "23505") {
      const msg = patch.email ? "That email is already in use" : "That username is already taken";
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    console.error("PATCH /api/account error:", e);
    return NextResponse.json({ error: "Could not save changes" }, { status: 500 });
  }
}
