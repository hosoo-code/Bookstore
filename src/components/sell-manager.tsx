"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { PLATFORM_FEE_PERCENT } from "@/lib/fees";

type Listing = { id: number; title: string; author: string; priceCents: number; stock: number };
type Category = { id: number; name: string };

export function SellManager({ categories, listings }: { categories: Category[]; listings: Listing[] }) {
  const router = useRouter();
  const [price, setPrice] = useState("");
  const [cover, setCover] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const priceNumber = Number(price) || 0;
  const earn = priceNumber * (100 - PLATFORM_FEE_PERCENT) / 100;
  const fmt = (value: number) => formatPrice(Math.round(value * 100));

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true); setMessage("");
    const form = new FormData(); form.set("file", file); form.set("purpose", "listing");
    const response = await fetch("/api/upload", { method: "POST", body: form });
    const data = await response.json();
    if (response.ok) setCover(data.url); else setMessage(data.error || "Upload failed.");
    setBusy(false);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const values = Object.fromEntries(new FormData(formElement));
    setBusy(true); setMessage("");
    const response = await fetch("/api/sell", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, coverUrl: cover }) });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) { setMessage(data.error || "Could not list the book."); return; }
    formElement.reset(); setPrice(""); setCover(""); setMessage("Your book is listed."); router.refresh();
  }
  async function setStock(id: number, stock: number) {
    await fetch(`/api/sell/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock }) });
    router.refresh();
  }
  async function remove(id: number) {
    if (!window.confirm("Remove this listing?")) return;
    await fetch(`/api/sell/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
    <form onSubmit={submit} className="panel grid gap-3 p-5">
      <h2 className="serif text-xl text-[#101B30]">List a book</h2>
      <input name="title" required minLength={2} maxLength={180} placeholder="Title" className="form-input" aria-label="Title" />
      <input name="author" required minLength={2} maxLength={120} placeholder="Author" className="form-input" aria-label="Author" />
      <div className="grid grid-cols-2 gap-3">
        <select name="categoryId" required className="form-input" aria-label="Category" defaultValue="">{<option value="" disabled>Category</option>}{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="language" className="form-input" aria-label="Language"><option>English</option><option>German</option><option>Mongolian</option></select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input name="price" type="number" step="any" min="1" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" className="form-input" aria-label="Price" />
        <input name="stock" type="number" min="1" max="999" required defaultValue={1} className="form-input" aria-label="Copies in stock" />
      </div>
      {priceNumber > 0 && <p className="text-xs leading-5 text-[#6b7280]">Platform fee {PLATFORM_FEE_PERCENT}%: <strong>{fmt(priceNumber - earn)}</strong>. You receive <strong className="text-[#101B30]">{fmt(earn)}</strong> per copy.</p>}
      <textarea name="description" maxLength={4000} rows={4} placeholder="Condition, edition, notes…" className="form-input" aria-label="Description" />
      <label className="text-xs font-semibold text-[#101B30]">Cover photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0])} className="mt-1 block w-full text-xs" /></label>
      {cover && <p className="text-xs text-[#4b7a4b]">Cover uploaded.</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Please wait…" : "Publish listing"}</button>
      {message && <p role="status" className="text-xs text-[#555]">{message}</p>}
    </form>
    <section aria-labelledby="my-listings">
      <h2 id="my-listings" className="serif mb-3 text-xl text-[#101B30]">Your listings</h2>
      {listings.length ? <ul className="grid gap-3">{listings.map((book) => <li key={book.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0"><Link href={`/books/${book.id}`} className="font-bold text-[#101B30]">{book.title}</Link><p className="text-xs text-[#777]">{book.author} · {formatPrice(book.priceCents)}</p></div>
        <div className="flex items-center gap-2 text-xs">
          <button type="button" className="btn-outline" aria-label="One less" onClick={() => setStock(book.id, Math.max(0, book.stock - 1))}>−</button>
          <span aria-label="Copies in stock">{book.stock} in stock</span>
          <button type="button" className="btn-outline" aria-label="One more" onClick={() => setStock(book.id, book.stock + 1)}>+</button>
          <button type="button" className="btn-outline" onClick={() => remove(book.id)}>Remove</button>
        </div></li>)}</ul> : <p className="text-sm text-[#777]">You haven’t listed any books yet.</p>}
    </section>
  </div>;
}
