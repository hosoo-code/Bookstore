import { db } from "@/db";
import { appSettings, books, categories, type Book } from "@/db/schema";
import { and, asc, eq, ilike, or, sql } from "drizzle-orm";

export const categorySeed = [
  { slug: "fiction", name: "Fiction" },
  { slug: "education", name: "Education" },
  { slug: "self-help", name: "Self-Help" },
  { slug: "technology", name: "Technology" },
  { slug: "romance", name: "Romance" },
  { slug: "fantasy", name: "Fantasy" },
  { slug: "science", name: "Science" },
  { slug: "others", name: "Others" },
];

const starterBooks = [
  { title: "Atomic Habits", author: "James Clear", category: "self-help", isbn: "9780735211292", cover: "atomic-habits", priceCents: 1499, rating: 48, ratingCount: "12k", featured: true, stock: 40, description: "An easy and proven way to build good habits and break bad ones. James Clear reveals how tiny changes can lead to remarkable results." },
  { title: "Dune", author: "Frank Herbert", category: "fiction", isbn: "9780441172719", cover: "dune", priceCents: 1699, rating: 47, ratingCount: "8k", featured: true, stock: 26, description: "Set on the desert planet Arrakis, Dune is the story of Paul Atreides and a sweeping, unforgettable universe of power, survival, and destiny." },
  { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", category: "fantasy", isbn: "9780590353427", cover: "harry-potter", priceCents: 1599, rating: 49, ratingCount: "15k", featured: true, stock: 33, description: "Step inside Hogwarts for the beginning of the beloved story of Harry Potter, a young wizard discovering friendship, courage, and magic." },
  { title: "The Midnight Library", author: "Matt Haig", category: "fiction", isbn: "9780525559474", cover: "midnight-library", priceCents: 1599, rating: 47, ratingCount: "6k", featured: true, stock: 24, description: "Between life and death there is a library, and within that library the shelves go on forever. A moving novel about second chances." },
  { title: "Think Like a Monk", author: "Jay Shetty", category: "self-help", isbn: "9781982134488", cover: "think-like-a-monk", priceCents: 1399, rating: 47, ratingCount: "9k", featured: true, stock: 37, description: "Jay Shetty shares timeless wisdom and practical steps to find calm and purpose in everyday life." },
  { title: "The Alchemist", author: "Paulo Coelho", category: "fiction", isbn: "9780062315007", cover: "the-alchemist", priceCents: 1299, rating: 47, ratingCount: "11k", stock: 19, description: "A magical story of Santiago, an Andalusian shepherd boy who journeys in search of a treasure as extravagant as any ever found." },
  { title: "Educated", author: "Tara Westover", category: "education", isbn: "9780399590504", cover: "educated", priceCents: 1699, rating: 48, ratingCount: "7k", stock: 21, description: "An unforgettable memoir about a young woman who, kept out of school, leaves her survivalist family and earns a PhD." },
  { title: "Sapiens", author: "Yuval Noah Harari", category: "science", isbn: "9780062316097", cover: "sapiens", priceCents: 1899, rating: 47, ratingCount: "10k", stock: 17, description: "A brief history of humankind, exploring how our species came to dominate the world and the ideas that bind us together." },
  { title: "Clean Code", author: "Robert C. Martin", category: "technology", isbn: "9780132350884", cover: "clean-code", priceCents: 3499, rating: 46, ratingCount: "5k", stock: 12, description: "A handbook of agile software craftsmanship, full of practical principles for writing readable and maintainable code." },
  { title: "The Psychology of Money", author: "Morgan Housel", category: "self-help", isbn: "9780857197689", cover: "psychology-of-money", priceCents: 1799, rating: 48, ratingCount: "6k", stock: 29, description: "Timeless lessons on wealth, greed, and happiness, told through short stories about the way people think about money." },
  { title: "Pride and Prejudice", author: "Jane Austen", category: "romance", isbn: "9780141439518", cover: "pride-and-prejudice", priceCents: 1199, rating: 48, ratingCount: "14k", stock: 25, description: "Jane Austen's enduring romance about Elizabeth Bennet and Mr. Darcy, sparkling with wit, heart, and social observation." },
  { title: "The Hobbit", author: "J.R.R. Tolkien", category: "fantasy", isbn: "9780547928227", cover: "the-hobbit", priceCents: 1499, rating: 49, ratingCount: "13k", stock: 30, description: "Bilbo Baggins is swept away on an unexpected journey across Middle-earth in this timeless adventure." },
  { title: "Deep Work", author: "Cal Newport", category: "self-help", isbn: "9781455586691", cover: "deep-work", priceCents: 1599, rating: 46, ratingCount: "4k", stock: 18, description: "Rules for focused success in a distracted world, showing how to develop the ability to work with deep concentration." },
  { title: "A Brief History of Time", author: "Stephen Hawking", category: "science", isbn: "9780553380163", cover: "brief-history-of-time", priceCents: 1699, rating: 47, ratingCount: "8k", stock: 16, description: "A landmark exploration of the universe, from the big bang to black holes, written for the curious reader." },
  { title: "The Design of Everyday Things", author: "Don Norman", category: "technology", isbn: "9780465050659", cover: "design-of-everyday-things", priceCents: 1999, rating: 46, ratingCount: "3k", stock: 14, description: "A classic introduction to human-centered design and why the things we use every day should work intuitively." },
  { title: "The Book Thief", author: "Markus Zusak", category: "fiction", isbn: "9780375842207", cover: "book-thief", priceCents: 1499, rating: 48, ratingCount: "9k", stock: 20, description: "A haunting story about a young girl, the books she steals, and the power of words during World War II." },
  { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", category: "romance", isbn: "9781501161933", cover: "evelyn-hugo", priceCents: 1699, rating: 48, ratingCount: "10k", stock: 28, description: "An aging Hollywood icon recounts the truth about her glamorous and scandalous life in this captivating novel." },
  { title: "English Grammar in Use", author: "Raymond Murphy", category: "education", isbn: "9781108457651", cover: "english-grammar", priceCents: 2799, rating: 46, ratingCount: "2k", stock: 22, description: "The popular self-study reference and practice book for intermediate learners of English." },
  { title: "The Little Prince", author: "Antoine de Saint-Exupéry", category: "others", isbn: "9780156012195", cover: "little-prince", priceCents: 1099, rating: 49, ratingCount: "12k", stock: 32, description: "A poetic tale about a young prince exploring the universe and discovering what truly matters." },
  { title: "Der Vorleser", author: "Bernhard Schlink", category: "fiction", isbn: "9783257229530", cover: "der-vorleser", priceCents: 1499, rating: 46, ratingCount: "2k", stock: 13, language: "German", description: "Ein bewegender Roman über Liebe, Erinnerung und die Auseinandersetzung mit der Vergangenheit." },
];

let seedPromise: Promise<void> | undefined;
export function ensureCatalog() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const [marker] = await db.select().from(appSettings).where(eq(appSettings.key, "catalog_seeded")).limit(1);
      if (marker) return;
      const existing = await db.select({ count: sql<number>`count(*)::int` }).from(books);
      if (existing[0].count > 0) {
        await db.insert(appSettings).values({ key: "catalog_seeded", value: "1" }).onConflictDoNothing();
        return;
      }
      await db.insert(categories).values(categorySeed).onConflictDoNothing();
      const allCategories = await db.select().from(categories);
      const ids = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]));
      await db.insert(books).values(starterBooks.map(({ category, cover, ...book }) => ({
        ...book,
        categoryId: ids[category],
        coverUrl: `/images/covers/${cover}.jpg`,
        featured: book.featured ?? false,
        language: "language" in book && book.language ? book.language : "English",
      }))).onConflictDoNothing();
      await db.insert(appSettings).values({ key: "catalog_seeded", value: "1" }).onConflictDoNothing();
    })().catch((error) => { seedPromise = undefined; throw error; });
  }
  return seedPromise;
}

export type CatalogBook = Book & { category: string; categorySlug: string };

export async function getCategories() {
  await ensureCatalog();
  return db.select().from(categories).orderBy(asc(categories.id));
}

export async function getBooks(options: { query?: string; category?: string; featured?: boolean; limit?: number } = {}): Promise<CatalogBook[]> {
  await ensureCatalog();
  const search = options.query?.trim().slice(0, 100);
  const conditions = [
    search ? or(ilike(books.title, `%${search}%`), ilike(books.author, `%${search}%`)) : undefined,
    options.category ? eq(categories.slug, options.category) : undefined,
    options.featured ? eq(books.featured, true) : undefined,
  ].filter((condition) => condition !== undefined);
  const query = db.select({ book: books, category: categories }).from(books).leftJoin(categories, eq(books.categoryId, categories.id))
    .where(conditions.length ? and(...conditions) : undefined).orderBy(asc(books.id));
  const rows = options.limit ? await query.limit(options.limit) : await query;
  return rows.map(({ book, category }) => ({ ...book, category: category?.name ?? "Others", categorySlug: category?.slug ?? "others" }));
}

export async function getBook(id: number): Promise<CatalogBook | null> {
  if (!Number.isSafeInteger(id) || id < 1) return null;
  await ensureCatalog();
  const [row] = await db.select({ book: books, category: categories }).from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id)).where(eq(books.id, id)).limit(1);
  return row ? { ...row.book, category: row.category?.name ?? "Others", categorySlug: row.category?.slug ?? "others" } : null;
}
