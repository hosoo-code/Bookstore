import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getBooks } from "@/lib/catalog";
import { CartView } from "@/components/cart-view";
export const metadata: Metadata = { title: "Your Cart" };
export const dynamic = "force-dynamic";
export default async function CartPage() {
  const [books, user] = await Promise.all([getBooks(), getCurrentUser()]);
  return <div className="site-container page-section"><p className="page-eyebrow">Your selection</p><h1 className="page-title mb-8">Shopping Cart</h1><CartView books={books} userId={user?.id ?? null} /></div>;
}
