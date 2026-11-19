import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db } from "@/db";
import { users } from "@/db/schema";
import { currentToken, currentUser, revokeOtherSessions } from "@/lib/auth";

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { currentPassword, newPassword } = (await req.json().catch(() => ({}))) as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!currentPassword || !newPassword) return NextResponse.json({ error: "Enter your current and new password" }, { status: 400 });
  if (newPassword.length < 6) return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  if (newPassword.length > 200) return NextResponse.json({ error: "New password is too long" }, { status: 400 });

  const ok = await bcrypt.compare(currentPassword, me.passwordHash);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });

  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(newPassword, 10), updatedAt: new Date() })
    .where(eq(users.id, me.id));
  // Sign out every other device; keep this one signed in.
  await revokeOtherSessions(me.id, await currentToken());
  return NextResponse.json({ ok: true });
}
