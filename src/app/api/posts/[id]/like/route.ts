import { db } from "@/db";
import { postLikes, posts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isUuid, apiError } from "@/lib/http";
import { canSeePost, notify } from "@/lib/social";
import { and, eq } from "drizzle-orm";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const id = (await params).id;
  if (!isUuid(id)) return apiError("Post not found.", 404);
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post || !(await canSeePost(post, user.id))) return apiError("Post not available.", 404);
  const where = and(eq(postLikes.postId, id), eq(postLikes.userId, user.id));
  const [existing] = await db.select().from(postLikes).where(where).limit(1);
  if (existing) { await db.delete(postLikes).where(where); return Response.json({ liked: false }); }
  await db.insert(postLikes).values({ postId: id, userId: user.id }).onConflictDoNothing();
  await notify(post.authorId, user.id, `${user.displayName} liked your post`, `/feed?post=${id}`);
  return Response.json({ liked: true });
}
