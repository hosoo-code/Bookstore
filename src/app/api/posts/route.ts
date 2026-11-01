import { db } from "@/db";
import { books, postImages, posts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { apiError, readObject, stringValue } from "@/lib/http";
import { getFeed } from "@/lib/social";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const url = new URL(request.url);
  return Response.json({ posts: await getFeed(user?.id ?? null, url.searchParams.get("tab") || "for-you") });
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in to write a post.", 401);
  const body = await readObject(request);
  const text = stringValue(body?.body, 3000);
  const kind = body?.kind === "review" ? "review" : "discussion";
  const visibility = body?.visibility === "followers" ? "followers" : "public";
  const imageUrl = stringValue(body?.imageUrl, 500);
  const bookId = body?.bookId ? Number(body.bookId) : null;
  if (!text || text.length > 3000) return apiError("Write something before posting (up to 3,000 characters).");
  if (imageUrl && !imageUrl.startsWith("/uploads/") && !imageUrl.startsWith("https://")) return apiError("Invalid image URL.");
  if (bookId) {
    const [book] = await db.select({ id: books.id }).from(books).where(eq(books.id, bookId)).limit(1);
    if (!book) return apiError("Book not found.", 404);
  }
  const [post] = await db.insert(posts).values({ authorId: user.id, body: text, kind, visibility, bookId }).returning();
  if (imageUrl) await db.insert(postImages).values({ postId: post.id, imageUrl });
  return Response.json({ post }, { status: 201 });
}
