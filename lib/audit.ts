import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";

export type AuditActor = { id: string; email: string; name: string; role: string };
export type AuditAction = {
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  summary?: string | null;
  before?: unknown;
  after?: unknown;
  intent?: string | null;
};
type AuditRow = typeof auditLog.$inferInsert;

const MAX_EVENTS_PER_SAVE = 120;
const MAX_FIELD_CHARS = 16000;

export const AUDITED_ARRAYS = [
  "products",
  "sales",
  "payments",
  "refunds",
  "customers",
  "customerCredits",
  "layaways",
  "layawayPayments",
  "orders",
  "receivings",
  "suppliers",
  "stocktakes",
  "cashbook",
  "accounts",
  "accountTransfers",
  "expenses",
  "expCats",
  "exCats",
  "recons",
  "transfers",
  "categories",
  "brands",
  "exchanges",
] as const;

const STAMP_FIELDS = ["userId", "createdBy", "createdAt", "updatedBy", "updatedAt"] as const;

export async function auditActorFromSession(): Promise<AuditActor | null> {
  const u = await currentUser();
  return u ? { id: u.id, email: u.email, name: u.name, role: u.role } : null;
}

function clip(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  const text = JSON.stringify(value);
  if (text.length <= MAX_FIELD_CHARS) return value;
  return { truncated: true, preview: text.slice(0, MAX_FIELD_CHARS) };
}

function toRow(action: AuditAction, actor: AuditActor | null): AuditRow {
  return {
    actorUserId: actor?.id || null,
    actorEmail: actor?.email ?? null,
    actorName: actor?.name ?? null,
    actorRole: actor ? normalizeRole(actor.role) : null,
    action: action.action,
    entityType: action.entityType ?? null,
    entityId: action.entityId ?? null,
    summary: action.summary ?? null,
    before: clip(action.before) as AuditRow["before"],
    after: clip(action.after) as AuditRow["after"],
    intent: action.intent ?? null,
  };
}

export async function writeAuditEntries(actions: AuditAction[], actor: AuditActor | null) {
  if (!actions.length) return;
  try {
    await db.insert(auditLog).values(actions.map((a) => toRow(a, actor)));
  } catch (e) {
    console.error("[audit] failed to write audit entries:", e);
  }
}

export async function recordAudit(action: AuditAction, actor: AuditActor | null) {
  await writeAuditEntries([action], actor);
}

function parsePayload(payload: string | null): Record<string, unknown> | null {
  if (!payload) return null;
  try {
    const value = JSON.parse(payload) as unknown;
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function keyFor(record: unknown, index: number): string {
  if (!record || typeof record !== "object" || Array.isArray(record)) return `index:${index}`;
  const r = record as Record<string, unknown>;
  const key = r.id ?? r.ref ?? r.reference ?? r.sku ?? r.code;
  return key == null || key === "" ? `index:${index}` : String(key);
}

function keyedArray(value: unknown): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  if (!Array.isArray(value)) return map;
  value.forEach((record, index) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return;
    let key = keyFor(record, index);
    if (map.has(key)) key = `${key}#${index}`;
    map.set(key, record as Record<string, unknown>);
  });
  return map;
}

function withoutStamps(record: Record<string, unknown>): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...record };
  for (const field of STAMP_FIELDS) delete copy[field];
  return copy;
}

function stampCreated(record: Record<string, unknown>, actor: AuditActor) {
  record.userId = actor.id;
  record.user = actor.name;
  record.createdBy = actor.name;
  record.createdAt = new Date().toISOString();
}

function stampUpdated(record: Record<string, unknown>, actor: AuditActor) {
  if (!record.userId) record.userId = actor.id;
  record.updatedBy = actor.name;
  record.updatedAt = new Date().toISOString();
}

function label(record: Record<string, unknown>): string {
  const name = record.name ?? record.title ?? record.ref ?? record.id ?? record.sku ?? "record";
  return String(name).slice(0, 200);
}

// Compares the previous and incoming state blobs, stamps actor details onto changed
// records, and returns the payload that should actually be persisted.
export function prepareAuditStateChange(
  previousPayload: string | null,
  incomingPayload: string,
  actor: AuditActor,
  intent: string,
): { payload: string; actions: AuditAction[] } {
  const next = parsePayload(incomingPayload);
  if (!next) return { payload: incomingPayload, actions: [] };
  const previous = parsePayload(previousPayload);

  if (!previous) {
    return {
      payload: incomingPayload,
      actions: [{ action: "state.initialised", entityType: "app_state", summary: "Initial business state saved", intent }],
    };
  }

  const actions: AuditAction[] = [];
  let capped = false;

  for (const key of AUDITED_ARRAYS) {
    const beforeMap = keyedArray(previous[key]);
    const afterMap = keyedArray(next[key]);

    for (const [id, after] of afterMap) {
      const before = beforeMap.get(id);
      if (!before) {
        stampCreated(after, actor);
        actions.push({
          action: "record.create",
          entityType: key,
          entityId: id,
          summary: `Created ${label(after)}`,
          after: withoutStamps(after),
          intent,
        });
      } else if (JSON.stringify(withoutStamps(before)) !== JSON.stringify(withoutStamps(after))) {
        stampUpdated(after, actor);
        actions.push({
          action: "record.update",
          entityType: key,
          entityId: id,
          summary: `Updated ${label(after)}`,
          before: withoutStamps(before),
          after: withoutStamps(after),
          intent,
        });
      }
    }

    for (const [id, before] of beforeMap) {
      if (!afterMap.has(id)) {
        actions.push({
          action: "record.delete",
          entityType: key,
          entityId: id,
          summary: `Deleted ${label(before)}`,
          before: withoutStamps(before),
          intent,
        });
      }
    }
  }

  if (JSON.stringify(previous.settings) !== JSON.stringify(next.settings)) {
    actions.push({
      action: "settings.update",
      entityType: "settings",
      summary: "Business settings changed",
      before: previous.settings,
      after: next.settings,
      intent,
    });
  }

  if (actions.length > MAX_EVENTS_PER_SAVE) {
    actions.length = MAX_EVENTS_PER_SAVE;
    capped = true;
  }
  if (capped) {
    actions.push({
      action: "state.bulk_update",
      summary: "Additional changes in this save were not itemised",
      intent,
    });
  }

  return { payload: JSON.stringify(next), actions };
}

const RECENT_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_RECENT_FAILURES = 5;

export async function tooManyFailedLogins(email: string): Promise<boolean> {
  try {
    const rows = await db
      .select({ id: auditLog.id })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.action, "auth.sign_in_failed"),
          eq(auditLog.actorEmail, email.toLowerCase()),
          gte(auditLog.at, new Date(Date.now() - RECENT_FAILURE_WINDOW_MS)),
        ),
      )
      .limit(MAX_RECENT_FAILURES);
    return rows.length >= MAX_RECENT_FAILURES;
  } catch (e) {
    console.error("[audit] failed to check login attempts:", e);
    return false;
  }
}

export async function listAudit(options: {
  entityType?: string | null;
  action?: string | null;
  actorUserId?: string | null;
  limit: number;
}) {
  const filters = [];
  if (options.entityType) filters.push(eq(auditLog.entityType, options.entityType));
  if (options.action) filters.push(eq(auditLog.action, options.action));
  if (options.actorUserId) filters.push(eq(auditLog.actorUserId, options.actorUserId));
  return db
    .select()
    .from(auditLog)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(auditLog.at))
    .limit(options.limit);
}
