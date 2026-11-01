import Link from "next/link";
import { ArrowRight, MessageCircle, UsersRound } from "lucide-react";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getBooks, getCategories } from "@/lib/catalog";
import { getFeed } from "@/lib/social";
import { timeAgo } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { Avatar } from "@/components/avatar";
import { BookCard } from "@/components/book-card";
import { CategoryBar } from "@/components/category-bar";
import { Hero } from "@/components/hero";
import { PromoBanner } from "@/components/promo-banner";
import { getT } from "@/lib/locale";
import { categoryName } from "@/lib/i18n";
import { BookRow } from "@/components/book-row";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const { t } = await getT();
  const [allBooks, user, categories] = await Promise.all([getBooks(), getCurrentUser(), getCategories()]);
  const featured = allBooks.filter((book) => book.featured);
  const [saved, recentPosts] = await Promise.all([
    user ? db.select({ bookId: favorites.bookId }).from(favorites).where(eq(favorites.userId, user.id)) : Promise.resolve([] as { bookId: number }[]),
    getFeed(user?.id ?? null),
  ]);
  const favoriteIds = new Set(saved.map((item) => item.bookId));
  return <>
    <Hero />
    <CategoryBar items={categories.map((c) => ({ slug: c.slug, name: categoryName(t, c.slug, c.name) }))} />
    <div className="site-container featured-section">
      <BookRow title={t("home.featured")} href="/books?featured=1" books={featured} userId={user?.id} savedIds={favoriteIds} />
      <BookRow title={t("home.english")} href="/books?language=English" books={allBooks.filter((book) => book.language === "English")} userId={user?.id} savedIds={favoriteIds} />
      <BookRow title={t("home.german")} href="/books?language=German" books={allBooks.filter((book) => book.language === "German")} userId={user?.id} savedIds={favoriteIds} />
      <BookRow title={t("home.mongolian")} href="/books?language=Mongolian" books={allBooks.filter((book) => book.language === "Mongolian")} userId={user?.id} savedIds={favoriteIds} />
      <div className="home-promo"><PromoBanner /></div>
      {categories.map((category) => <BookRow key={category.slug} title={categoryName(t, category.slug, category.name)} href={`/categories/${category.slug}`} books={allBooks.filter((book) => book.categorySlug === category.slug)} userId={user?.id} savedIds={favoriteIds} />)}
      <div className="view-all-wrap"><Link href="/books" className="btn-primary">{t("home.viewAllBooks")} <ArrowRight size={14} /></Link></div>
    </div>
    <section className="border-t border-[#e9e3d8] bg-[#f5f0e8] py-12 md:py-16" aria-labelledby="readers-title"><div className="site-container">
      <div className="section-heading-row"><div><p className="page-eyebrow mb-2">{t("home.corner")}</p><h2 id="readers-title" className="section-title">{t("home.fromReaders")}</h2></div><Link href="/feed" className="text-arrow">{t("home.exploreFeed")} <ArrowRight size={16} /></Link></div>
      {recentPosts.length ? <div className="grid gap-4 md:grid-cols-2">{recentPosts.slice(0, 2).map((post) => <article key={post.id} className="social-card p-5"><div className="mb-4 flex items-center gap-3"><Avatar name={post.author.displayName} src={post.author.avatarUrl} size={40} /><div><Link href={`/profile/${post.author.username}`} className="text-sm font-bold text-[#101B30]">{post.author.displayName}</Link><p className="text-xs text-[#858585]">@{post.author.username} · {timeAgo(post.createdAt)}</p></div></div><p className="line-clamp-3 text-sm leading-6 text-[#4b5563]">{post.body}</p><Link href={`/feed?post=${post.id}`} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#a5823d]"><MessageCircle size={14} /> {t("home.join")}</Link></article>)}</div> : <div className="social-card flex flex-col items-center px-5 py-10 text-center"><span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#f2e8d5] text-[#9d783c]"><UsersRound size={23} /></span><h3 className="serif text-xl text-[#101B30]">{t("home.emptyTitle")}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-[#777]">{t("home.emptyDesc")}</p><Link href="/feed" className="btn-primary mt-5">{t("home.exploreReader")} <ArrowRight size={14} /></Link></div>}
    </div></section>
  </>;
}
