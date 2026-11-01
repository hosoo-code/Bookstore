import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CatalogBook } from "@/lib/catalog";
import { getT } from "@/lib/locale";
import { BookCard } from "@/components/book-card";

export async function BookRow({ title, href, books, userId, savedIds }: { title: string; href: string; books: CatalogBook[]; userId?: string | null; savedIds: Set<number> }) {
  if (!books.length) return null;
  const { t } = await getT();
  const id = `row-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <section className="book-row" aria-labelledby={id}>
    <div className="section-heading-row"><h2 id={id} className="section-title">{title}</h2><Link href={href} className="text-arrow">{t("home.viewAll")} <ArrowRight size={16} /></Link></div>
    <div className="row-scroller" role="list" tabIndex={0} aria-label={`${title}, swipe to see more`}>
      {books.map((book) => <div key={book.id} role="listitem" className="row-item"><BookCard book={book} userId={userId} initiallySaved={savedIds.has(book.id)} /></div>)}
      <Link href={href} className="row-more" aria-label={`${t("home.viewAll")}: ${title}`}><span><ArrowRight size={22} /></span>{t("home.viewAll")}</Link>
    </div>
  </section>;
}
