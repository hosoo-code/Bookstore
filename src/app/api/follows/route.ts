import { db } from "@/db";
import { profiles, userFollows } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isUuid, apiError, readObject } from "@/lib/http";
import { areBlocked, notify } from "@/lib/social";
import { and, eq } from "drizzle-orm";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in to follow readers.", 401);
  const body = await readObject(request);
  const targetId = String(body?.targetId || "");
  if (!isUuid(targetId) || targetId === user.id) return apiError("Invalid reader.");
  const [target] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, targetId)).limit(1);
  if (!target) return apiError("Reader not found.", 404);
  if (await areBlocked(user.id, targetId)) return apiError("This connection is unavailable.", 403);
  const [created] = await db.insert(userFollows).values({ followerId: user.id, followingId: targetId }).onConflictDoNothing().returning();
  if (created) await notify(targetId, user.id, `${user.displayName} started following you`, `/profile/${user.username}`);
  return Response.json({ following: true });
}
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const body = await readObject(request);
  const targetId = String(body?.targetId || "");
  if (!isUuid(targetId)) return apiError("Invalid reader.");
  await db.delete(userFollows).where(and(eq(userFollows.followerId, user.id), eq(userFollows.followingId, targetId)));
  return Response.json({ following: false });
}
