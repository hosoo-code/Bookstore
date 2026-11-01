import { db } from "@/db";
import { favorites, books } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { apiError, readObject } from "@/lib/http";
import { and, eq } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const rows = await db.select({ book: books }).from(favorites).innerJoin(books, eq(favorites.bookId, books.id)).where(eq(favorites.userId, user.id));
  return Response.json({ books: rows.map((r) => r.book) });
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const body = await readObject(request);
  const bookId = Number(body?.bookId);
  if (!Number.isSafeInteger(bookId)) return apiError("Invalid book.");
  const [existing] = await db.select().from(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.bookId, bookId))).limit(1);
  if (existing) {
    await db.delete(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.bookId, bookId)));
    return Response.json({ saved: false });
  }
  const [book] = await db.select({ id: books.id }).from(books).where(eq(books.id, bookId)).limit(1);
  if (!book) return apiError("Book not found.", 404);
  await db.insert(favorites).values({ userId: user.id, bookId }).onConflictDoNothing();
  return Response.json({ saved: true });
}
