"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Book } from "@/db/schema";
import { useCart } from "@/components/cart-provider";
import { useLocale } from "@/components/locale-provider";
import { formatPrice } from "@/lib/utils";

export function BookCard({ book, userId, initiallySaved = false }: { book: Book; userId?: string | null; initiallySaved?: boolean }) {
  const { addItem } = useCart();
  const { t } = useLocale();
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);
  async function toggleFavorite() {
    if (!userId) { router.push(`/login?next=/books/${book.id}`); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId: book.id }) });
      if (response.ok) setSaved((await response.json()).saved);
    } finally { setBusy(false); }
  }
  return <article className="book-card">
    <div className="book-cover-area">
      <Link href={`/books/${book.id}`} className="absolute inset-0 z-0" aria-label={`View ${book.title}`} />
      {book.coverUrl ? <Image src={book.coverUrl} width={200} height={300} alt={`${book.title} book cover`} unoptimized={book.coverUrl.startsWith("http") || book.coverUrl.startsWith("/uploads/")} /> : <span className="book-cover-fallback">{book.title}</span>}
      <button type="button" className={`book-heart ${saved ? "saved" : ""}`} aria-label={saved ? `Remove ${book.title} from favorites` : `Save ${book.title} to favorites`} onClick={toggleFavorite} disabled={busy}><Heart size={15} fill={saved ? "currentColor" : "none"} /></button>
    </div>
    <div className="book-card-info"><Link href={`/books/${book.id}`} className="book-card-title" title={book.title}>{book.title}</Link>
      <span className="book-card-author">{book.author}</span>
      <div className="book-rating"><Star size={12} fill="currentColor" strokeWidth={0} /><span>{(book.rating / 10).toFixed(1)}</span><span className="review-count">({book.ratingCount})</span></div>
      <div className="book-card-bottom"><span className="book-price">{formatPrice(book.priceCents)}</span></div>
      <button type="button" className="add-cart-button" onClick={() => addItem(book.id)} disabled={book.stock < 1}><ShoppingBag size={13} />{book.stock < 1 ? t("book.out") : t("book.add")}</button>
    </div>
  </article>;
}
