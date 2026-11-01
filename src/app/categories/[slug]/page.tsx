import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getBooks, getCategories } from "@/lib/catalog";
import { eq } from "drizzle-orm";
import { BookCard } from "@/components/book-card";
import { CategoryBar } from "@/components/category-bar";

type Context = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Context): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getCategories()).find((item) => item.slug === slug);
  return { title: category ? `${category.name} Books` : "Category", description: `Discover ${category?.name || "our"} books at BookBuch.` };
}
export const dynamic = "force-dynamic";
export default async function CategoryPage({ params }: Context) {
  const slug = (await params).slug;
  const allCategories = await getCategories();
  const category = allCategories.find((item) => item.slug === slug);
  if (!category) notFound();
  const [items, user] = await Promise.all([getBooks({ category: slug }), getCurrentUser()]);
  const saved = user ? await db.select({ bookId: favorites.bookId }).from(favorites).where(eq(favorites.userId, user.id)) : [];
  const favoriteIds = new Set(saved.map((item) => item.bookId));
  return <><div className="bg-[#101B30] py-12 text-center text-white"><div className="site-container"><p className="text-[11px] font-bold uppercase tracking-[2px] text-[#D8B46C]">Explore by genre</p><h1 className="serif mt-2 text-4xl md:text-5xl">{category.name} Books</h1><p className="mt-3 text-sm text-[#d7dce3]">Find a book that speaks to you.</p></div></div>
    <CategoryBar active={slug} items={allCategories} />
    <div className="site-container page-section !pt-9"><div className="section-heading-row"><h2 className="section-title">Explore {category.name}</h2><Link href="/books" className="text-arrow">All Books <ArrowRight size={15} /></Link></div>
      {items.length ? <div className="book-list-grid">{items.map((book) => <BookCard key={book.id} book={book} userId={user?.id} initiallySaved={favoriteIds.has(book.id)} />)}</div> : <div className="panel py-14 text-center"><p className="serif text-xl text-[#101B30]">No books in this category yet.</p><Link href="/books" className="btn-outline mt-4">Browse all books</Link></div>}
    </div>
  </>;
}
