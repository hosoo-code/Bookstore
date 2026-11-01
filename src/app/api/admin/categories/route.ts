import { db } from "@/db";
import { books, categories } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { apiError, readObject, stringValue } from "@/lib/http";
import { eq } from "drizzle-orm";

export async function GET() {
  if (!(await isAdmin())) return apiError("Admin access required.", 403);
  return Response.json({ categories: await db.select().from(categories) });
}
export async function POST(request: Request) {
  if (!(await isAdmin())) return apiError("Admin access required.", 403);
  const body = await readObject(request);
  const name = stringValue(body?.name, 60);
  const slug = stringValue(body?.slug, 60).toLowerCase();
  if (!name || !/^[a-z0-9-]{2,60}$/.test(slug)) return apiError("Enter a name and a URL-friendly slug.");
  try { const [category] = await db.insert(categories).values({ name, slug }).returning(); return Response.json({ category }, { status: 201 }); }
  catch { return apiError("That category slug already exists.", 409); }
}
export async function PATCH(request: Request) {
  if (!(await isAdmin())) return apiError("Admin access required.", 403);
  const body = await readObject(request);
  const id = Number(body?.id);
  const name = stringValue(body?.name, 60);
  const slug = stringValue(body?.slug, 60).toLowerCase();
  if (!Number.isSafeInteger(id) || !name || !/^[a-z0-9-]{2,60}$/.test(slug)) return apiError("Invalid category.");
  try {
    const [category] = await db.update(categories).set({ name, slug }).where(eq(categories.id, id)).returning();
    return category ? Response.json({ category }) : apiError("Category not found.", 404);
  } catch { return apiError("That category slug already exists.", 409); }
}
export async function DELETE(request: Request) {
  if (!(await isAdmin())) return apiError("Admin access required.", 403);
  const body = await readObject(request);
  const id = Number(body?.id);
  if (!Number.isSafeInteger(id)) return apiError("Invalid category.");
  const [book] = await db.select({ id: books.id }).from(books).where(eq(books.categoryId, id)).limit(1);
  if (book) return apiError("Move or remove books in this category first.", 409);
  await db.delete(categories).where(eq(categories.id, id));
  return Response.json({ ok: true });
}
