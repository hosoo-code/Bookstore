import { db } from "@/db";
import { postComments, posts, profiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isUuid, apiError, readObject, stringValue } from "@/lib/http";
import { canSeePost, notify } from "@/lib/social";
import { asc, eq } from "drizzle-orm";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  const id = (await params).id;
  if (!isUuid(id)) return apiError("Post not found.", 404);
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post || !(await canSeePost(post, user?.id ?? null))) return apiError("Post not available.", 404);
  const rows = await db.select({ comment: postComments, author: { id: profiles.id, username: profiles.username, displayName: profiles.displayName, avatarUrl: profiles.avatarUrl } }).from(postComments)
    .innerJoin(profiles, eq(postComments.userId, profiles.id)).where(eq(postComments.postId, id)).orderBy(asc(postComments.createdAt));
  return Response.json({ comments: rows.map(({ comment, author }) => ({ ...comment, author })) });
}
export async function POST(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in to comment.", 401);
  const id = (await params).id;
  if (!isUuid(id)) return apiError("Post not found.", 404);
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post || !(await canSeePost(post, user.id))) return apiError("Post not available.", 404);
  const body = await readObject(request);
  const text = stringValue(body?.body, 500);
  if (!text) return apiError("Comment cannot be empty.");
  const [comment] = await db.insert(postComments).values({ postId: id, userId: user.id, body: text }).returning();
  await notify(post.authorId, user.id, `${user.displayName} commented on your post`, `/feed?post=${id}`);
  return Response.json({ comment: { ...comment, author: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl } } }, { status: 201 });
}
