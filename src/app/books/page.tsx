import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getBooks, getCategories } from "@/lib/catalog";
import { eq } from "drizzle-orm";
import { getT } from "@/lib/locale";
import { categoryName } from "@/lib/i18n";
import { BookCard } from "@/components/book-card";

export const metadata: Metadata = { title: "Browse All Books", description: "Browse English and German books by title, author, genre, and price at BookBuch." };
export const dynamic = "force-dynamic";
type SearchParams = Promise<{ q?: string; category?: string; language?: string; featured?: string; sort?: string; focus?: string }>;
export default async function BooksPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { t } = await getT();
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const category = typeof params.category === "string" ? params.category : "";
  const [all, user, allCategories] = await Promise.all([getBooks({ query, category: category || undefined }), getCurrentUser(), getCategories()]);
  let filtered = all.filter((book) => (!params.language || book.language === params.language) && (!params.featured || book.featured));
  if (params.sort === "price-low") filtered = [...filtered].sort((a, b) => a.priceCents - b.priceCents);
  if (params.sort === "price-high") filtered = [...filtered].sort((a, b) => b.priceCents - a.priceCents);
  if (params.sort === "top-rated") filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  const saved = user ? await db.select({ bookId: favorites.bookId }).from(favorites).where(eq(favorites.userId, user.id)) : [];
  const favoriteIds = new Set(saved.map((item) => item.bookId));
  return <div className="site-container page-section">
    <p className="page-eyebrow">{t("books.eyebrow")}</p><h1 className="page-title">{t("books.title")}</h1>
    <p className="page-description mb-7">{t("books.desc")}</p>
    <form action="/books" className="panel mb-6 flex flex-wrap items-center gap-3 p-4">
      <div className="relative min-w-[180px] flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#858585]" /><input name="q" defaultValue={query} autoFocus={params.focus === "search"} placeholder={t("books.searchPh")} className="form-input pl-10" aria-label={t("books.searchPh")} /></div>
      <select name="category" defaultValue={category} className="form-input w-auto min-w-[130px]" aria-label="Choose category"><option value="">{t("books.allGenres")}</option>{allCategories.map((item) => <option key={item.slug} value={item.slug}>{categoryName(t, item.slug, item.name)}</option>)}</select>
      <select name="language" defaultValue={params.language || ""} className="form-input w-auto min-w-[125px]" aria-label="Choose language"><option value="">{t("books.bothLang")}</option><option value="English">{t("nav.english")}</option><option value="German">{t("nav.german")}</option><option value="Mongolian">{t("nav.mongolian")}</option></select>
      <select name="sort" defaultValue={params.sort || ""} className="form-input w-auto min-w-[135px]" aria-label="Sort books"><option value="">{t("books.recommended")}</option><option value="price-low">{t("books.priceLow")}</option><option value="price-high">{t("books.priceHigh")}</option><option value="top-rated">{t("books.topRated")}</option></select>
      <button type="submit" className="btn-primary"><SlidersHorizontal size={15} /> {t("books.apply")}</button>
    </form>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[#777]">{t("books.showing")} <strong className="text-[#101B30]">{filtered.length}</strong> {filtered.length === 1 ? t("books.book") : t("books.books")}{query ? <> {t("books.for")} “{query}”</> : null}</p><div className="flex flex-wrap gap-2">{allCategories.slice(0, 5).map((item) => <Link key={item.slug} href={`/categories/${item.slug}`} className="soft-pill hover:bg-[#eaddc3]">{categoryName(t, item.slug, item.name)}</Link>)}</div></div>
    {filtered.length ? <div className="book-list-grid">{filtered.map((book) => <BookCard key={book.id} book={book} userId={user?.id} initiallySaved={favoriteIds.has(book.id)} />)}</div> : <div className="panel py-16 text-center"><h2 className="serif text-2xl text-[#101B30]">{t("books.none")}</h2><p className="mt-2 text-sm text-[#777]">{t("books.tryAnother")}</p><Link href="/books" className="btn-outline mt-5">{t("books.clear")}</Link></div>}
  </div>;
}
