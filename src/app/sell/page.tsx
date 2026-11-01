import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { books, orderItems, orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/catalog";
import { PLATFORM_FEE_PERCENT } from "@/lib/fees";
import { formatPrice } from "@/lib/utils";
import { SellManager } from "@/components/sell-manager";

export const metadata: Metadata = { title: "Sell your books" };
export const dynamic = "force-dynamic";
export default async function SellPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/sell");
  const [categories, listings, sales, [totals]] = await Promise.all([
    getCategories(),
    db.select().from(books).where(eq(books.sellerId, user.id)).orderBy(desc(books.id)),
    db.select({ id: orderItems.id, title: orderItems.title, quantity: orderItems.quantity, earnings: orderItems.sellerEarningsCents, status: orders.status, name: orders.shippingName, address: orders.shippingAddress, phone: orders.shippingPhone, createdAt: orders.createdAt })
      .from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(eq(orderItems.sellerId, user.id)).orderBy(desc(orders.createdAt)).limit(50),
    db.select({ earnings: sql<number>`coalesce(sum(${orderItems.sellerEarningsCents}),0)::int`, fees: sql<number>`coalesce(sum(${orderItems.feeCents}),0)::int` })
      .from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(and(eq(orderItems.sellerId, user.id), ne(orders.status, "cancelled"))),
  ]);
  return <div className="site-container page-section">
    <h1 className="page-title">Sell your books</h1>
    <p className="page-description mb-6">List a book and readers can buy it right away. BookBuch keeps a {PLATFORM_FEE_PERCENT}% fee on each sale; the rest is yours.</p>
    <div className="panel mb-8 grid grid-cols-2 gap-4 p-5 text-sm"><div><p className="text-xs text-[#777]">Your earnings</p><p className="serif text-2xl text-[#101B30]">{formatPrice(totals.earnings)}</p></div><div><p className="text-xs text-[#777]">Fees paid ({PLATFORM_FEE_PERCENT}%)</p><p className="serif text-2xl text-[#101B30]">{formatPrice(totals.fees)}</p></div></div>
    <SellManager categories={categories.map((c) => ({ id: c.id, name: c.name }))} listings={listings.map((b) => ({ id: b.id, title: b.title, author: b.author, priceCents: b.priceCents, stock: b.stock }))} />
    <section className="mt-10" aria-labelledby="my-sales"><h2 id="my-sales" className="serif mb-3 text-xl text-[#101B30]">Orders to ship</h2>
      {sales.length ? <ul className="grid gap-3">{sales.map((sale) => <li key={sale.id} className="panel p-4 text-sm"><p className="font-bold text-[#101B30]">{sale.quantity} × {sale.title} <span className="font-normal text-[#777]">· you receive {formatPrice(sale.earnings)} · {sale.status}</span></p><p className="mt-1 text-xs leading-5 text-[#555]">{sale.name}, {sale.phone}<br />{sale.address}</p></li>)}</ul> : <p className="text-sm text-[#777]">No orders yet.</p>}
    </section>
  </div>;
}
