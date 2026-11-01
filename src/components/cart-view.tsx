"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { Book } from "@/db/schema";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/utils";
export function CartView({ books, userId }: { books: Book[]; userId: string | null }) {
  const { items, ready, updateQuantity, removeItem } = useCart();
  const bookMap = new Map(books.map((book) => [book.id, book]));
  const subtotal = items.reduce((sum, item) => sum + (bookMap.get(item.bookId)?.priceCents || 0) * item.quantity, 0);
  if (!ready) return <div className="panel animate-pulse p-12 text-center text-sm text-[#777]">Loading your cart...</div>;
  if (!items.length) return <div className="panel flex flex-col items-center px-5 py-20 text-center"><ShoppingBag size={38} strokeWidth={1.3} className="mb-5 text-[#bca16e]" /><h2 className="serif text-2xl text-[#101B30]">Your cart is waiting for a good story.</h2><p className="mt-2 text-sm text-[#777]">Explore our shelves and find something you’ll love.</p><Link href="/books" className="btn-primary mt-6">Browse Books <ArrowRight size={15} /></Link></div>;
  return <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
    <div className="panel overflow-hidden"><div className="border-b border-[#ede8df] px-6 py-5"><h2 className="serif text-xl text-[#101B30]">Books in your bag <span className="font-sans text-sm text-[#888]">({items.length})</span></h2></div>
      <div className="divide-y divide-[#f0ece6]">{items.map((item) => { const book = bookMap.get(item.bookId); return <div key={item.bookId} className="flex gap-4 p-5 sm:gap-6 sm:p-6">
        <Link href={book ? `/books/${book.id}` : "/books"} className="flex h-[116px] w-[82px] shrink-0 items-center justify-center rounded bg-[#f4f0e9] p-2">{book?.coverUrl ? <Image src={book.coverUrl} width={65} height={98} alt={book.title} className="max-h-full w-auto object-contain shadow-sm" unoptimized={book.coverUrl.startsWith("http") || book.coverUrl.startsWith("/uploads/")} /> : <ShoppingBag size={25} className="text-[#bca16e]" />}</Link>
        <div className="min-w-0 flex-1"><Link href={book ? `/books/${book.id}` : "/books"} className="serif line-clamp-2 text-[17px] font-semibold text-[#101B30]">{book?.title || "Book no longer available"}</Link><p className="mt-1 text-xs text-[#888]">{book?.author || "Please remove this item"}</p>
          {book && book.stock < item.quantity && <p className="mt-1 text-xs text-red-600">Only {book.stock} left in stock</p>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center rounded-md border border-[#e7e1d7]"><button type="button" className="grid h-8 w-8 place-items-center" onClick={() => updateQuantity(item.bookId, item.quantity - 1)} disabled={item.quantity <= 1} aria-label={`Decrease ${book?.title || "book"} quantity`}><Minus size={13} /></button><span className="min-w-7 text-center text-xs font-semibold">{item.quantity}</span><button type="button" className="grid h-8 w-8 place-items-center" onClick={() => updateQuantity(item.bookId, item.quantity + 1)} disabled={item.quantity >= Math.min(book?.stock || 10, 10)} aria-label={`Increase ${book?.title || "book"} quantity`}><Plus size={13} /></button></div><span className="text-sm font-bold text-[#101B30]">{formatPrice((book?.priceCents || 0) * item.quantity)}</span></div>
        </div><button type="button" className="self-start text-[#999] hover:text-red-600" onClick={() => removeItem(item.bookId)} aria-label={`Remove ${book?.title || "book"} from cart`}><Trash2 size={17} /></button>
      </div>; })}</div>
    </div>
    <aside className="panel p-6"><h2 className="serif mb-6 text-xl text-[#101B30]">Order Summary</h2><div className="flex justify-between text-sm text-[#606875]"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="mt-4 flex justify-between text-sm text-[#606875]"><span>Delivery</span><span className="text-xs">Confirmed at checkout</span></div><div className="my-5 border-t border-[#eae4d9]" /><div className="flex justify-between text-base font-bold text-[#101B30]"><span>Books total</span><span>{formatPrice(subtotal)}</span></div><Link href={userId ? "/checkout" : "/login?next=/checkout"} className="btn-primary mt-6 w-full">Proceed to Checkout <ArrowRight size={16} /></Link><Link href="/books" className="mt-4 block text-center text-xs font-semibold text-[#8c754f]">Continue Shopping</Link><p className="mt-6 text-xs leading-5 text-[#9b9b9b]">Payment is collected on delivery. No online card payment is processed.</p></aside>
  </div>;
}
