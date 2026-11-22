import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { countAudit, listAudit } from "@/lib/audit";
import { getRoleDefinitions } from "@/lib/role-store";
import { normalizeRole } from "@/lib/roles";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const defs = await getRoleDefinitions();
  if (normalizeRole(user.role, defs.map((d) => d.key)) !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  const params = new URL(req.url).searchParams;
  const requested = Number(params.get("limit") ?? 50);
  const limit = Math.max(1, Math.min(200, Number.isFinite(requested) ? requested : 50));
  const requestedOffset = Number(params.get("offset") ?? 0);
  const offset = Math.max(0, Number.isFinite(requestedOffset) ? Math.floor(requestedOffset) : 0);

  const options = {
    entityType: params.get("entityType"),
    action: params.get("action"),
    actorUserId: params.get("actorUserId"),
    actorUsername: params.get("actorUsername"),
    search: params.get("search"),
    from: params.get("from"),
    to: params.get("to"),
  };

  try {
    const [entries, total] = await Promise.all([
      listAudit({ ...options, limit, offset }),
      countAudit(options),
    ]);
    return NextResponse.json({ entries, total, limit, offset });
  } catch (e) {
    console.error("GET /api/audit error:", e);
    return NextResponse.json({ error: "Failed to load audit trail" }, { status: 500 });
  }
}
