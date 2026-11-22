import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customRoles, users } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { getRoleDefinitions } from "@/lib/role-store";
import { MODULES, normalizeRole, OWNER_ONLY_MODULES, type ModuleKey } from "@/lib/roles";

const MODULE_KEYS = MODULES.map((m) => m.key);

async function requireOwner() {
  const user = await currentUser();
  if (!user) return { status: 401 as const, error: "Sign in required" };
  const defs = await getRoleDefinitions();
  if (normalizeRole(user.role, defs.map((d) => d.key)) !== "owner") {
    return { status: 403 as const, error: "Owner access required" };
  }
  return { user };
}

function actor(user: { id: string; email: string; name: string; role: string; username: string | null }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role, username: user.username };
}

function cleanModules(value: unknown, allowOwnerOnly = false): string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const valid = value.filter((m): m is string => typeof m === "string" && MODULE_KEYS.includes(m as ModuleKey));
  const ownerOnly = valid.some((m) => OWNER_ONLY_MODULES.includes(m as ModuleKey));
  if (valid.length !== value.length || (ownerOnly && !allowOwnerOnly)) return null;
  const unique = [...new Set(valid)];
  return unique.length === value.length && unique.length > 0 ? unique : null;
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "role";
}

export async function GET() {
  const auth = await requireOwner();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const defs = await getRoleDefinitions();
  return NextResponse.json({ roles: defs });
}

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = (await req.json()) as { name?: string; description?: string; modules?: unknown };
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim() || null;
    const modules = cleanModules(body.modules);
    if (!name || name.length > 60) {
      return NextResponse.json({ error: "Enter a category name (60 characters or fewer)" }, { status: 400 });
    }
    if (description && description.length > 200) {
      return NextResponse.json({ error: "Description must be 200 characters or fewer" }, { status: 400 });
    }
    if (!modules) {
      return NextResponse.json({ error: "Select at least one valid module" }, { status: 400 });
    }

    const existing = await db.select().from(customRoles);
    if (existing.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: "A category with that name already exists" }, { status: 409 });
    }

    const base = `custom-${slug(name)}`;
    let id = base;
    let n = 2;
    while (existing.some((r) => r.id === id)) id = `${base}-${n++}`;

    const [created] = await db
      .insert(customRoles)
      .values({ id, name, description, modules })
      .returning();

    await recordAudit(
      {
        action: "roles.create",
        entityType: "roles",
        entityId: id,
        summary: `Created access category ${name} with ${modules.length} module(s)`,
        after: { id, name, modules },
        intent: "users",
      },
      actor(auth.user),
    );

    return NextResponse.json({
      ok: true,
      role: { key: created.id, label: created.name, description: created.description, modules: created.modules, builtIn: false },
    }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/roles error:", e);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = (await req.json()) as { id?: string; name?: string; description?: string; modules?: unknown };
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "Category id required" }, { status: 400 });

    const defs = await getRoleDefinitions();
    const target = defs.find((d) => d.key === id);
    if (!target) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const name = body.name !== undefined ? String(body.name).trim() : target.label;
    if (!name || name.length > 60) {
      return NextResponse.json({ error: "Enter a category name (60 characters or fewer)" }, { status: 400 });
    }
    const description = body.description !== undefined
      ? String(body.description).trim() || null
      : target.description ?? null;
    if (description && description.length > 200) {
      return NextResponse.json({ error: "Description must be 200 characters or fewer" }, { status: 400 });
    }
    let modules = body.modules !== undefined ? cleanModules(body.modules, id === "owner") : [...target.modules];
    if (!modules) {
      return NextResponse.json({ error: "Select at least one valid module" }, { status: 400 });
    }
    if (id === "owner") modules = [...new Set([...modules, ...OWNER_ONLY_MODULES])];

    const existing = await db.select().from(customRoles);
    if (existing.some((r) => r.id !== id && r.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: "A category with that name already exists" }, { status: 409 });
    }

    const [updated] = await db
      .insert(customRoles)
      .values({ id, name, description, modules })
      .onConflictDoUpdate({
        target: customRoles.id,
        set: { name, description, modules, updatedAt: new Date() },
      })
      .returning();

    await recordAudit(
      {
        action: "roles.update",
        entityType: "roles",
        entityId: id,
        summary: `Updated access category ${name}`,
        before: { name: target.label, modules: target.modules },
        after: { name, modules },
        intent: "users",
      },
      actor(auth.user),
    );

    return NextResponse.json({
      ok: true,
      role: { key: updated.id, label: updated.name, description: updated.description, modules: updated.modules, builtIn: target.builtIn },
    });
  } catch (e) {
    console.error("PATCH /api/admin/roles error:", e);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = (await req.json()) as { id?: string };
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "Category id required" }, { status: 400 });

    const defs = await getRoleDefinitions();
    const target = defs.find((d) => d.key === id);
    if (!target) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    if (id === "owner") {
      return NextResponse.json({ error: "The Owner / Admin category cannot be deleted" }, { status: 403 });
    }

    const assigned = await db.select({ id: users.id }).from(users).where(eq(users.role, id)).limit(1);
    if (assigned.length) {
      return NextResponse.json({ error: "Move team members off this category before deleting it" }, { status: 409 });
    }

    if (target.builtIn) {
      await db
        .insert(customRoles)
        .values({ id, name: target.label, description: target.description, modules: [] })
        .onConflictDoUpdate({
          target: customRoles.id,
          set: { name: target.label, description: target.description, modules: [], updatedAt: new Date() },
        });
    } else {
      await db.delete(customRoles).where(eq(customRoles.id, id));
    }
    await recordAudit(
      {
        action: "roles.delete",
        entityType: "roles",
        entityId: id,
        summary: `Deleted access category ${target.label}`,
        before: { name: target.label, modules: target.modules },
        intent: "users",
      },
      actor(auth.user),
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/roles error:", e);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
