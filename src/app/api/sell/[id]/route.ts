import { db } from "@/db";
import { books } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { apiError, readObject } from "@/lib/http";
import { and, eq } from "drizzle-orm";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const id = Number((await params).id);
  const body = await readObject(request);
  if (!body || !Number.isSafeInteger(id)) return apiError("Invalid request.");
  const update: Partial<typeof books.$inferInsert> = {};
  if (body.stock !== undefined) { const stock = Number(body.stock); if (!Number.isInteger(stock) || stock < 0 || stock > 999) return apiError("Invalid stock."); update.stock = stock; }
  if (body.price !== undefined) { const cents = Math.round(Number(body.price) * 100); if (!Number.isInteger(cents) || cents < 100) return apiError("Invalid price."); update.priceCents = cents; }
  if (!Object.keys(update).length) return apiError("Nothing to update.");
  const [book] = await db.update(books).set(update).where(and(eq(books.id, id), eq(books.sellerId, user.id))).returning();
  return book ? Response.json({ book }) : apiError("Listing not found.", 404);
}
export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) return apiError("Invalid request.");
  const [book] = await db.delete(books).where(and(eq(books.id, id), eq(books.sellerId, user.id))).returning({ id: books.id });
  return book ? Response.json({ ok: true }) : apiError("Listing not found.", 404);
}
