"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole, PackageCheck } from "lucide-react";
import type { Book } from "@/db/schema";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/utils";
export function CheckoutForm({ books, displayName }: { books: Book[]; displayName: string }) {
  const { items, ready, clearCart } = useCart();
  const [name, setName] = useState(displayName);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const bookMap = new Map(books.map((book) => [book.id, book]));
  const total = items.reduce((sum, item) => sum + (bookMap.get(item.bookId)?.priceCents || 0) * item.quantity, 0);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, address, phone, items }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not place order.");
      setOrderId(data.order.id); clearCart();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not place order."); }
    finally { setBusy(false); }
  }
  if (orderId) return <div className="panel mx-auto max-w-xl px-7 py-14 text-center"><CheckCircle2 size={47} className="mx-auto mb-5 text-[#749273]" strokeWidth={1.4} /><h2 className="serif text-3xl text-[#101B30]">Your order is placed.</h2><p className="mt-3 text-sm leading-6 text-[#777]">Thank you for shopping at BookBuch. Your order is pending and payment will be collected on delivery.</p><p className="mt-5 rounded-lg bg-[#f8f5ef] p-3 text-xs text-[#677081]">Order ID: {orderId}</p><Link href="/profile#orders" className="btn-primary mt-6">View Order History <ArrowRight size={15} /></Link></div>;
  if (!ready) return <div className="panel p-12 text-center text-sm text-[#777]">Loading checkout...</div>;
  if (!items.length) return <div className="panel py-16 text-center"><h2 className="serif text-2xl text-[#101B30]">Your cart is empty.</h2><Link href="/books" className="btn-primary mt-5">Browse Books</Link></div>;
  return <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
    <form id="checkout-form" onSubmit={submit} className="panel p-6 md:p-8"><div className="mb-6 flex items-center gap-3"><PackageCheck size={22} className="text-[#b99a5c]" /><h2 className="serif text-2xl text-[#101B30]">Delivery details</h2></div>
      <div className="grid gap-5"><label><span className="field-label">Full name</span><input className="form-input" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} autoComplete="name" /></label><label><span className="field-label">Phone number</span><input className="form-input" value={phone} onChange={(event) => setPhone(event.target.value)} required minLength={6} autoComplete="tel" placeholder="Your contact number" /></label><label><span className="field-label">Delivery address</span><textarea className="form-input min-h-28 resize-y" value={address} onChange={(event) => setAddress(event.target.value)} required minLength={8} autoComplete="street-address" placeholder="Street address, city, postal code" /></label></div>
      <div className="mt-7 rounded-lg border border-[#e8decb] bg-[#fbf8f1] p-4"><p className="flex items-center gap-2 text-sm font-bold text-[#101B30]"><LockKeyhole size={16} className="text-[#a98749]" /> Cash on delivery</p><p className="mt-1 text-xs leading-5 text-[#777]">Pay when your books arrive. No card details are requested or charged online.</p></div>
      {error && <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">{busy ? "Placing order..." : "Place Order"} <ArrowRight size={16} /></button>
    </form>
    <aside className="panel p-6"><h2 className="serif mb-5 text-xl text-[#101B30]">Your order</h2><div className="space-y-4">{items.map((item) => { const book = bookMap.get(item.bookId); return <div key={item.bookId} className="flex justify-between gap-3 text-xs"><span className="max-w-[195px] text-[#5f6670]">{book?.title || "Unavailable book"} <span className="text-[#999]">× {item.quantity}</span></span><span className="font-bold text-[#101B30]">{formatPrice((book?.priceCents || 0) * item.quantity)}</span></div>; })}</div><div className="mt-6 flex justify-between border-t border-[#e9e4dd] pt-5 text-base font-bold text-[#101B30]"><span>Books total</span><span>{formatPrice(total)}</span></div><p className="mt-4 flex items-center gap-2 text-xs text-[#777]"><CheckCircle2 size={14} className="text-[#779179]" /> Stock and prices verified at order time</p><Link href="/cart" className="mt-5 block text-center text-xs font-semibold text-[#967c4e]">Edit cart</Link></aside>
  </div>;
}
