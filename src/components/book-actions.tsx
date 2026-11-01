"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";
export function BookActions({ bookId, stock, userId, savedInitially, readingInitially }: { bookId: number; stock: number; userId: string | null; savedInitially: boolean; readingInitially: string | null }) {
  const { addItem, showToast } = useCart();
  const router = useRouter();
  const [saved, setSaved] = useState(savedInitially);
  const [reading, setReading] = useState(readingInitially);
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!userId) { router.push(`/login?next=/books/${bookId}`); return; }
    setBusy(true);
    try { const response = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId }) }); const data = await response.json(); if (response.ok) { setSaved(data.saved); showToast(data.saved ? "Saved to favorites" : "Removed from favorites"); } else showToast(data.error); }
    finally { setBusy(false); }
  }
  async function updateReading(status: string) {
    if (!userId) { router.push(`/login?next=/books/${bookId}`); return; }
    const response = await fetch("/api/reading", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookId, status }) });
    if (response.ok) { setReading(status === "none" ? null : status); showToast(status === "read" ? "Added to books you’ve read" : status === "reading" ? "Added to currently reading" : "Removed from reading list"); }
  }
  return <div className="mt-7 space-y-3"><div className="flex flex-wrap gap-3"><button type="button" className="btn-primary min-w-[190px]" disabled={stock < 1} onClick={() => addItem(bookId)}><ShoppingBag size={17} />{stock < 1 ? "Out of stock" : "Add to Cart"}</button><button type="button" className="btn-outline" onClick={save} disabled={busy}><Heart size={17} fill={saved ? "currentColor" : "none"} />{saved ? "Saved to Favorites" : "Save to Favorites"}</button></div>
    <div className="flex flex-wrap items-center gap-2 pt-2"><BookOpen size={16} className="mr-1 text-[#a5823d]" /><span className="mr-1 text-xs text-[#777]">My reading shelf:</span>{["reading", "read"].map((status) => <button type="button" key={status} onClick={() => updateReading(reading === status ? "none" : status)} className={`rounded-full border px-3 py-1.5 text-xs ${reading === status ? "border-[#D8B46C] bg-[#f3e8d2] text-[#101B30]" : "border-[#ded8cc] text-[#687282]"}`}>{status === "reading" ? "Currently Reading" : "I’ve Read This"}</button>)}</div>
  </div>;
}
