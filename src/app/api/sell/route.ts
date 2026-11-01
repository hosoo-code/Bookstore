import { db } from "@/db";
import { books, categories } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { apiError, readObject, stringValue } from "@/lib/http";
import { and, eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in to sell books.", 401);
  const body = await readObject(request);
  if (!body) return apiError("Invalid request.");
  const title = stringValue(body.title, 180);
  const author = stringValue(body.author, 120);
  const priceCents = Math.round(Number(body.price) * 100);
  const stock = Number(body.stock);
  const categoryId = Number(body.categoryId);
  const language = ["English", "German", "Mongolian"].includes(String(body.language)) ? String(body.language) : "English";
  const coverUrl = stringValue(body.coverUrl, 500);
  if (title.length < 2 || author.length < 2) return apiError("Enter the book title and author.");
  if (!Number.isInteger(priceCents) || priceCents < 100) return apiError("Enter a valid price.");
  if (!Number.isInteger(stock) || stock < 1 || stock > 999) return apiError("Stock must be between 1 and 999.");
  if (coverUrl && !coverUrl.startsWith("/uploads/") && !coverUrl.startsWith("https://")) return apiError("Invalid cover image.");
  const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (!category) return apiError("Choose a category.");
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(books).where(eq(books.sellerId, user.id));
  if (count >= 100) return apiError("You reached the limit of 100 listings.");
  const [book] = await db.insert(books).values({ title, author, categoryId, priceCents, stock, language, coverUrl, description: stringValue(body.description, 4000), sellerId: user.id, featured: false, isbn: null }).returning();
  return Response.json({ book }, { status: 201 });
}
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  return Response.json({ books: await db.select().from(books).where(and(eq(books.sellerId, user.id))) });
}
