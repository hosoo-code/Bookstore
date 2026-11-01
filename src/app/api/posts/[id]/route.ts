import { db } from "@/db";
import { posts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isUuid, apiError, readObject, stringValue } from "@/lib/http";
import { eq } from "drizzle-orm";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const id = (await params).id;
  if (!isUuid(id)) return apiError("Post not found.", 404);
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) return apiError("Post not found.", 404);
  if (post.authorId !== user.id) return apiError("You can only edit your own post.", 403);
  const body = await readObject(request);
  if (!body) return apiError("Invalid request.");
  const update: Partial<typeof posts.$inferInsert> = { updatedAt: new Date() };
  if (body.body !== undefined) { const text = stringValue(body.body, 3000); if (!text) return apiError("Post cannot be empty."); update.body = text; }
  if (body.kind !== undefined) { if (!["review", "discussion"].includes(String(body.kind))) return apiError("Invalid post type."); update.kind = String(body.kind); }
  if (body.visibility !== undefined) { if (!["public", "followers"].includes(String(body.visibility))) return apiError("Invalid visibility."); update.visibility = String(body.visibility); }
  const [updated] = await db.update(posts).set(update).where(eq(posts.id, id)).returning();
  return Response.json({ post: updated });
}
export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const id = (await params).id;
  if (!isUuid(id)) return apiError("Post not found.", 404);
  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) return apiError("Post not found.", 404);
  if (post.authorId !== user.id && user.role !== "admin") return apiError("You can only delete your own post.", 403);
  await db.delete(posts).where(eq(posts.id, id));
  return Response.json({ ok: true });
}
