import { db } from "@/db";
import { books, readingLists } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { apiError, readObject } from "@/lib/http";
import { and, eq } from "drizzle-orm";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const body = await readObject(request);
  const bookId = Number(body?.bookId);
  const status = body?.status;
  if (!Number.isSafeInteger(bookId) || !["reading", "read", "none"].includes(String(status))) return apiError("Invalid reading status.");
  if (status === "none") await db.delete(readingLists).where(and(eq(readingLists.userId, user.id), eq(readingLists.bookId, bookId)));
  else {
    const [book] = await db.select({ id: books.id }).from(books).where(eq(books.id, bookId)).limit(1);
    if (!book) return apiError("Book not found.", 404);
    await db.insert(readingLists).values({ userId: user.id, bookId, status: String(status) }).onConflictDoUpdate({ target: [readingLists.userId, readingLists.bookId], set: { status: String(status) } });
  }
  return Response.json({ status });
}
