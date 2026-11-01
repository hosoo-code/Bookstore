import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { eq } from "drizzle-orm";
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  await db.update(profiles).set({ lastSeenAt: new Date() }).where(eq(profiles.id, user.id));
  return Response.json({ ok: true });
}
