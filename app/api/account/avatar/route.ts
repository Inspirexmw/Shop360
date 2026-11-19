import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { currentUser, publicUser } from "@/lib/auth";

// The client resizes the photo to 256px before sending, so a data URL stays well under this cap.
const MAX_CHARS = 300_000;
const ALLOWED = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { image } = (await req.json().catch(() => ({}))) as { image?: string };
  if (typeof image !== "string" || !ALLOWED.test(image))
    return NextResponse.json({ error: "Upload a JPEG, PNG or WebP image" }, { status: 400 });
  if (image.length > MAX_CHARS) return NextResponse.json({ error: "Photo is too large" }, { status: 413 });

  const [updated] = await db
    .update(users)
    .set({ avatar: image, updatedAt: new Date() })
    .where(eq(users.id, me.id))
    .returning();
  return NextResponse.json({ ok: true, user: publicUser(updated) });
}

export async function DELETE() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const [updated] = await db
    .update(users)
    .set({ avatar: null, updatedAt: new Date() })
    .where(eq(users.id, me.id))
    .returning();
  return NextResponse.json({ ok: true, user: publicUser(updated) });
}
