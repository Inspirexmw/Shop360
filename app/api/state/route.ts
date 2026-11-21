import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appState } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { prepareAuditStateChange, recordAudit, writeAuditEntries } from "@/lib/audit";
import { canRunIntent, normalizeRole } from "@/lib/roles";

const STATE_ID = "shop360-blank-test-state-v1";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  try {
    const row = await db
      .select({ payload: appState.payload, version: appState.version })
      .from(appState)
      .where(eq(appState.id, STATE_ID))
      .limit(1);
    if (!row.length) {
      return NextResponse.json({ payload: null, version: 0 });
    }
    return NextResponse.json({ payload: row[0].payload, version: row[0].version });
  } catch (e) {
    console.error("GET /api/state error:", e);
    return NextResponse.json({ error: "failed to load state" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  try {
    const body = (await req.json()) as { payload?: string; version?: number; intent?: string };
    if (typeof body.payload !== "string") {
      return NextResponse.json({ error: "payload required" }, { status: 400 });
    }
    if (!canRunIntent(normalizeRole(user.role), body.intent ?? "general")) {
      return NextResponse.json({ error: "Your role cannot perform this action" }, { status: 403 });
    }

    const existing = await db
      .select({ id: appState.id, version: appState.version, payload: appState.payload })
      .from(appState)
      .where(eq(appState.id, STATE_ID))
      .limit(1);

    const clientVersion = typeof body.version === "number" ? body.version : -1;
    const dbVersion = existing.length ? existing[0].version : 0;

    // Optimistic concurrency: reject stale writes so the client can reconcile.
    if (existing.length && clientVersion >= 0 && clientVersion !== dbVersion) {
      return NextResponse.json(
        {
          error: "state_conflict",
          message: "State was updated elsewhere. Reloading to reconcile.",
          version: dbVersion,
          payload: existing[0].payload,
        },
        { status: 409 },
      );
    }

    const nextVersion = dbVersion + 1;
    const actor = { id: user.id, email: user.email, name: user.name, role: user.role };
    const { payload: stampedPayload, actions } = prepareAuditStateChange(
      existing.length ? existing[0].payload : null,
      body.payload,
      actor,
      body.intent ?? "general",
    );

    if (existing.length) {
      await db
        .update(appState)
        .set({ payload: stampedPayload, version: nextVersion, updatedAt: new Date() })
        .where(eq(appState.id, STATE_ID));
    } else {
      await db.insert(appState).values({
        id: STATE_ID,
        payload: stampedPayload,
        version: nextVersion,
      });
    }

    await writeAuditEntries(actions, actor);
    return NextResponse.json({ ok: true, version: nextVersion, auditEvents: actions.length });
  } catch (e) {
    console.error("POST /api/state error:", e);
    return NextResponse.json({ error: "failed to save state" }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (normalizeRole(user.role) !== "owner") {
    return NextResponse.json({ error: "Only an owner can erase all data" }, { status: 403 });
  }
  try {
    await recordAudit(
      {
        action: "data.erase",
        entityType: "app_state",
        entityId: STATE_ID,
        summary: "All business data erased by owner",
        intent: "data",
      },
      { id: user.id, email: user.email, name: user.name, role: user.role },
    );
    await db.delete(appState).where(eq(appState.id, STATE_ID));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/state error:", e);
    return NextResponse.json({ error: "failed to clear state" }, { status: 500 });
  }
}
