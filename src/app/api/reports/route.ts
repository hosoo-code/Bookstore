import { db } from "@/db";
import { posts, profiles, userReports } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isUuid, apiError, readObject, stringValue } from "@/lib/http";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const body = await readObject(request);
  const reason = stringValue(body?.reason, 500);
  const targetUserId = typeof body?.targetUserId === "string" ? body.targetUserId : null;
  const targetPostId = typeof body?.targetPostId === "string" ? body.targetPostId : null;
  if (reason.length < 5 || (!targetUserId && !targetPostId)) return apiError("Please provide a reason and a post or reader to report.");
  if ((targetUserId && !isUuid(targetUserId)) || (targetPostId && !isUuid(targetPostId))) return apiError("Invalid report target.");
  if (targetUserId && !(await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, targetUserId)).limit(1)).length) return apiError("Reader not found.", 404);
  if (targetPostId && !(await db.select({ id: posts.id }).from(posts).where(eq(posts.id, targetPostId)).limit(1)).length) return apiError("Post not found.", 404);
  await db.insert(userReports).values({ reporterId: user.id, targetUserId, targetPostId, reason });
  return Response.json({ ok: true }, { status: 201 });
}
