import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { listAudit } from "@/lib/audit";
import { normalizeRole } from "@/lib/roles";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (normalizeRole(user.role) !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  const params = new URL(req.url).searchParams;
  const requested = Number(params.get("limit") ?? 100);
  const limit = Math.max(1, Math.min(200, Number.isFinite(requested) ? requested : 100));

  try {
    const entries = await listAudit({
      entityType: params.get("entityType"),
      action: params.get("action"),
      actorUserId: params.get("actorUserId"),
      limit,
    });
    return NextResponse.json({ entries });
  } catch (e) {
    console.error("GET /api/audit error:", e);
    return NextResponse.json({ error: "Failed to load audit trail" }, { status: 500 });
  }
}
