import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isUuid } from "@/lib/http";
import { cancelUnpaidOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/orders/${id}`);
  if (!isUuid(id)) notFound();
  let [order] = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.userId, user.id))).limit(1);
  if (!order) notFound();
  if (order.paymentMethod === "bonum" && order.paymentStatus === "unpaid" && Date.now() - order.createdAt.getTime() > 35 * 60_000) {
    await cancelUnpaidOrder(order.id);
    [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  }
  const paid = order.paymentStatus === "paid";
  const title = paid ? "Payment received. Thank you!" : order.status === "cancelled" ? "This order was cancelled." : order.paymentMethod === "bonum" ? "Waiting for your payment…" : "Your order is placed.";
  return <div className="site-container page-section"><div className="panel mx-auto max-w-xl px-7 py-12 text-center">
    <h1 className="serif text-3xl text-[#101B30]">{title}</h1>
    <p className="mt-3 text-sm text-[#777]">Total {formatPrice(order.totalCents)} · Order {order.id.slice(0, 8)}</p>
    {order.paymentMethod === "bonum" && !paid && order.status !== "cancelled" && <><p className="mt-4 text-xs leading-5 text-[#777]">If you already paid, this page updates within a minute. Refresh to check.</p>{order.paymentUrl && <a href={order.paymentUrl} className="btn-primary mt-5">Pay now</a>}</>}
    {order.paymentStatus === "refund_needed" && <p className="mt-4 text-xs text-[#a14a4a]">Your payment arrived after the order expired. We will refund you; contact us if you need help.</p>}
    <Link href="/profile#orders" className="btn-outline mt-6">View order history</Link>
  </div></div>;
}
