import { db } from "@/db";
import { books, categories } from "@/db/schema";
import { getBooks } from "@/lib/catalog";
import { isAdmin } from "@/lib/auth";
import { apiError, readObject, stringValue } from "@/lib/http";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return Response.json({ books: await getBooks({ query: url.searchParams.get("q") || undefined, category: url.searchParams.get("category") || undefined }) });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return apiError("Admin access required.", 403);
  const body = await readObject(request);
  if (!body) return apiError("Invalid request.");
  const title = stringValue(body.title, 180);
  const author = stringValue(body.author, 120);
  const categoryId = Number(body.categoryId);
  const priceCents = Math.round(Number(body.price) * 100);
  const stock = Number(body.stock);
  const coverUrl = stringValue(body.coverUrl, 500);
  if (!title || !author || !Number.isInteger(priceCents) || priceCents < 0 || !Number.isInteger(stock) || stock < 0) return apiError("Title, author, valid price, and stock are required.");
  if (coverUrl && !coverUrl.startsWith("/uploads/") && !coverUrl.startsWith("/images/") && !coverUrl.startsWith("https://")) return apiError("Invalid cover URL.");
  const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (!category) return apiError("Choose a valid category.");
  try {
    const [book] = await db.insert(books).values({ title, author, description: stringValue(body.description, 4000), categoryId, priceCents, stock, coverUrl, language: stringValue(body.language, 40) || "English", featured: body.featured === true, isbn: stringValue(body.isbn, 30) || null }).returning();
    return Response.json({ book }, { status: 201 });
  } catch { return apiError("Could not add book. Check the ISBN is unique.", 409); }
}
