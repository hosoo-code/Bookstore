import { db } from "@/db";
import { profiles, userBlocks, userFollows } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isUuid, apiError, readObject } from "@/lib/http";
import { and, eq, or } from "drizzle-orm";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const body = await readObject(request);
  const targetId = String(body?.targetId || "");
  if (!isUuid(targetId) || targetId === user.id) return apiError("Invalid reader.");
  const [target] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, targetId)).limit(1);
  if (!target) return apiError("Reader not found.", 404);
  await db.insert(userBlocks).values({ blockerId: user.id, blockedId: targetId }).onConflictDoNothing();
  await db.delete(userFollows).where(or(
    and(eq(userFollows.followerId, user.id), eq(userFollows.followingId, targetId)),
    and(eq(userFollows.followerId, targetId), eq(userFollows.followingId, user.id)),
  ));
  return Response.json({ blocked: true });
}
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const body = await readObject(request);
  const targetId = String(body?.targetId || "");
  if (!isUuid(targetId)) return apiError("Invalid reader.");
  await db.delete(userBlocks).where(and(eq(userBlocks.blockerId, user.id), eq(userBlocks.blockedId, targetId)));
  return Response.json({ blocked: false });
}
