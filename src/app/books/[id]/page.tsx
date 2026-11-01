import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Star, Truck, ShieldCheck, BookOpen } from "lucide-react";
import { db } from "@/db";
import { favorites, readingLists } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getBook, getBooks } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { BookCard } from "@/components/book-card";
import { BookActions } from "@/components/book-actions";

type Context = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Context): Promise<Metadata> {
  const book = await getBook(Number((await params).id));
  return { title: book ? `${book.title} by ${book.author}` : "Book not found", description: book?.description || "Explore books at BookBuch.", openGraph: book?.coverUrl ? { images: [book.coverUrl] } : undefined };
}
export const dynamic = "force-dynamic";
export default async function BookDetailPage({ params }: Context) {
  const book = await getBook(Number((await params).id));
  if (!book) notFound();
  const user = await getCurrentUser();
  const [favorite, reading, related] = await Promise.all([
    user ? db.select().from(favorites).where(and(eq(favorites.userId, user.id), eq(favorites.bookId, book.id))).limit(1) : Promise.resolve([]),
    user ? db.select().from(readingLists).where(and(eq(readingLists.userId, user.id), eq(readingLists.bookId, book.id))).limit(1) : Promise.resolve([]),
    getBooks({ category: book.categorySlug, limit: 6 }),
  ]);
  return <div className="site-container page-section !pt-7">
    <nav className="mb-7 flex flex-wrap items-center gap-2 text-xs text-[#858585]" aria-label="Breadcrumb"><Link href="/books" className="hover:text-[#101B30]">Books</Link><span>/</span><Link href={`/categories/${book.categorySlug}`} className="hover:text-[#101B30]">{book.category}</Link><span>/</span><span className="text-[#101B30]">{book.title}</span></nav>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)] lg:gap-16">
      <div className="panel flex items-center justify-center bg-[#f3efe7] px-9 py-10 md:px-14 md:py-14">{book.coverUrl ? <Image src={book.coverUrl} width={350} height={525} alt={`${book.title} cover`} className="max-h-[480px] w-auto max-w-full object-contain shadow-[10px_14px_24px_#101b3030]" priority unoptimized={book.coverUrl.startsWith("http") || book.coverUrl.startsWith("/uploads/")} /> : <div className="book-cover-fallback !h-[400px]">{book.title}</div>}</div>
      <div className="py-1 md:py-5"><Link href={`/categories/${book.categorySlug}`} className="page-eyebrow">{book.category} · {book.language}</Link><h1 className="page-title !mt-3 !mb-2">{book.title}</h1><p className="text-base text-[#777]">by <span className="text-[#364052]">{book.author}</span></p>
        <div className="mt-5 flex items-center gap-2 text-sm"><Star size={17} className="text-[#c7a45f]" fill="currentColor" strokeWidth={0} /><span className="font-bold text-[#101B30]">{(book.rating / 10).toFixed(1)}</span><span className="text-[#999]">({book.ratingCount} ratings)</span></div>
        <div className="my-6 h-px bg-[#e5ded2]" /><p className="text-3xl font-bold text-[#101B30]">{formatPrice(book.priceCents)}</p><p className={`mt-2 text-xs font-semibold ${book.stock > 0 ? "text-[#5f875e]" : "text-red-600"}`}>{book.stock > 0 ? `${book.stock} copies available` : "Out of stock"}</p>
        <p className="mt-6 max-w-xl text-sm leading-7 text-[#626b77]">{book.description}</p>
        <BookActions bookId={book.id} stock={book.stock} userId={user?.id ?? null} savedInitially={favorite.length > 0} readingInitially={reading[0]?.status ?? null} />
        <div className="mt-9 grid max-w-lg grid-cols-2 gap-4 border-t border-[#e5ded2] pt-6 text-xs text-[#69717c]"><div className="flex items-center gap-2"><Truck size={19} className="text-[#b29153]" /> Thoughtful delivery</div><div className="flex items-center gap-2"><ShieldCheck size={19} className="text-[#b29153]" /> Secure checkout</div><div className="flex items-center gap-2"><BookOpen size={19} className="text-[#b29153]" /> Carefully curated</div></div>
      </div>
    </div>
    <div className="mt-16"><div className="section-heading-row"><h2 className="section-title">You May Also Like</h2><Link href="/books" className="text-arrow">All Books <ArrowRight size={15} /></Link></div><div className="book-list-grid">{related.filter((item) => item.id !== book.id).slice(0, 5).map((item) => <BookCard key={item.id} book={item} userId={user?.id} />)}</div></div>
    <Link href="/books" className="mt-9 inline-flex items-center gap-2 text-xs font-semibold text-[#767d87]"><ArrowLeft size={15} /> Back to books</Link>
  </div>;
}
