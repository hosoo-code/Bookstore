import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBooks, getCategories } from "@/lib/catalog";
import { db } from "@/db";
import { orderItems, orders, profiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { formatPrice } from "@/lib/utils";
import { PLATFORM_FEE_PERCENT } from "@/lib/fees";
import { AdminDashboard } from "@/components/admin-dashboard";
export const metadata: Metadata = { title: "Admin Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") notFound();
  const [books, categories, [fees], sellers] = await Promise.all([getBooks(), getCategories(),
    db.select({ fees: sql<number>`coalesce(sum(${orderItems.feeCents}),0)::int`, sales: sql<number>`coalesce(sum(${orderItems.unitPriceCents} * ${orderItems.quantity}),0)::int` })
      .from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(sql`${orders.paymentStatus} = 'paid' and ${orderItems.sellerId} is not null`),
    db.select({ username: profiles.username, earnings: sql<number>`coalesce(sum(${orderItems.sellerEarningsCents}),0)::int`, fees: sql<number>`coalesce(sum(${orderItems.feeCents}),0)::int` })
      .from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).innerJoin(profiles, eq(orderItems.sellerId, profiles.id)).where(eq(orders.paymentStatus, "paid")).groupBy(profiles.username).orderBy(sql`2 desc`).limit(20),
  ]);
  return <div className="site-container page-section">
    <section className="panel mb-8 p-5" aria-labelledby="fees-title"><h2 id="fees-title" className="serif text-xl text-[#101B30]">Marketplace fees ({PLATFORM_FEE_PERCENT}%)</h2>
      <p className="mt-2 text-sm text-[#555]">Seller sales: <strong>{formatPrice(fees.sales)}</strong> · Fees earned: <strong className="text-[#101B30]">{formatPrice(fees.fees)}</strong></p>
      {sellers.length > 0 && <ul className="mt-3 grid gap-1 text-xs text-[#555]">{sellers.map((s) => <li key={s.username}>@{s.username}: earned {formatPrice(s.earnings)} · fee {formatPrice(s.fees)}</li>)}</ul>}
    </section><AdminDashboard initialBooks={books} initialCategories={categories} adminId={user.id} /></div>;
}
