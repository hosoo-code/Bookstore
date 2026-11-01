import { db } from "@/db";
import { books, cartItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { apiError, readObject } from "@/lib/http";
import { and, eq } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const rows = await db.select({ bookId: cartItems.bookId, quantity: cartItems.quantity, book: books }).from(cartItems)
    .innerJoin(books, eq(cartItems.bookId, books.id)).where(eq(cartItems.userId, user.id));
  return Response.json({ items: rows });
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const body = await readObject(request);
  const bookId = Number(body?.bookId);
  const quantity = Number(body?.quantity ?? 1);
  if (!Number.isSafeInteger(bookId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) return apiError("Invalid quantity.");
  const [book] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
  if (!book || book.stock < 1) return apiError("This book is out of stock.", 409);
  const [existing] = await db.select().from(cartItems).where(and(eq(cartItems.userId, user.id), eq(cartItems.bookId, bookId))).limit(1);
  const next = Math.min(existing ? existing.quantity + quantity : quantity, book.stock, 10);
  await db.insert(cartItems).values({ userId: user.id, bookId, quantity: next }).onConflictDoUpdate({ target: [cartItems.userId, cartItems.bookId], set: { quantity: next } });
  return Response.json({ bookId, quantity: next });
}
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const body = await readObject(request);
  const bookId = Number(body?.bookId);
  const quantity = Number(body?.quantity);
  if (!Number.isSafeInteger(bookId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) return apiError("Invalid quantity.");
  const [book] = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
  if (!book || quantity > book.stock) return apiError("Not enough stock available.", 409);
  await db.update(cartItems).set({ quantity }).where(and(eq(cartItems.userId, user.id), eq(cartItems.bookId, bookId)));
  return Response.json({ bookId, quantity });
}
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const body = await readObject(request);
  const bookId = Number(body?.bookId);
  if (!Number.isSafeInteger(bookId)) return apiError("Invalid book.");
  await db.delete(cartItems).where(and(eq(cartItems.userId, user.id), eq(cartItems.bookId, bookId)));
  return Response.json({ ok: true });
}
