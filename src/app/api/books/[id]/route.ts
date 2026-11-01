import { db } from "@/db";
import { books, categories } from "@/db/schema";
import { getBook } from "@/lib/catalog";
import { isAdmin } from "@/lib/auth";
import { apiError, readObject, stringValue } from "@/lib/http";
import { eq } from "drizzle-orm";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  const book = await getBook(Number((await params).id));
  return book ? Response.json({ book }) : apiError("Book not found.", 404);
}
export async function PATCH(request: Request, { params }: Context) {
  if (!(await isAdmin())) return apiError("Admin access required.", 403);
  const id = Number((await params).id);
  const body = await readObject(request);
  if (!body || !Number.isSafeInteger(id)) return apiError("Invalid request.");
  const update: Partial<typeof books.$inferInsert> = {};
  if (body.title !== undefined) update.title = stringValue(body.title, 180);
  if (body.author !== undefined) update.author = stringValue(body.author, 120);
  if (body.description !== undefined) update.description = stringValue(body.description, 4000);
  if (body.language !== undefined) update.language = stringValue(body.language, 40);
  if (body.coverUrl !== undefined) {
    const url = stringValue(body.coverUrl, 500);
    if (url && !url.startsWith("/uploads/") && !url.startsWith("/images/") && !url.startsWith("https://")) return apiError("Invalid cover URL.");
    update.coverUrl = url;
  }
  if (body.featured !== undefined) update.featured = body.featured === true;
  if (body.isbn !== undefined) update.isbn = stringValue(body.isbn, 30) || null;
  if (body.price !== undefined) { const cents = Math.round(Number(body.price) * 100); if (!Number.isInteger(cents) || cents < 0) return apiError("Invalid price."); update.priceCents = cents; }
  if (body.stock !== undefined) { const stock = Number(body.stock); if (!Number.isInteger(stock) || stock < 0) return apiError("Invalid stock."); update.stock = stock; }
  if (body.categoryId !== undefined) {
    const [category] = await db.select().from(categories).where(eq(categories.id, Number(body.categoryId))).limit(1);
    if (!category) return apiError("Invalid category."); update.categoryId = category.id;
  }
  if (!Object.keys(update).length || update.title === "" || update.author === "") return apiError("No valid changes provided.");
  try {
    const [book] = await db.update(books).set(update).where(eq(books.id, id)).returning();
    return book ? Response.json({ book }) : apiError("Book not found.", 404);
  } catch { return apiError("Could not save changes. Check the ISBN is unique.", 409); }
}
export async function DELETE(_request: Request, { params }: Context) {
  if (!(await isAdmin())) return apiError("Admin access required.", 403);
  const [deleted] = await db.delete(books).where(eq(books.id, Number((await params).id))).returning({ id: books.id });
  return deleted ? Response.json({ ok: true }) : apiError("Book not found.", 404);
}
