import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { auditActorFromSession, recordAudit } from "@/lib/audit";

export async function POST() {
  const actor = await auditActorFromSession();
  await destroySession();
  await recordAudit({ action: "auth.sign_out", entityType: "session", summary: "Signed out", intent: "auth" }, actor);
  return NextResponse.json({ ok: true });
}
