import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBooks } from "@/lib/catalog";
import { CheckoutForm } from "@/components/checkout-form";
export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";
export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/checkout");
  const books = await getBooks();
  return <div className="site-container page-section"><p className="page-eyebrow">Almost there</p><h1 className="page-title mb-8">Checkout</h1><CheckoutForm books={books} displayName={user.displayName} /></div>;
}
