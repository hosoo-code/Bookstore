import { db } from "@/db";
import { books, orderItems, orders } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/** Cancels an order that was never paid and returns its stock. Safe to call repeatedly. */
export async function cancelUnpaidOrder(orderId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update").limit(1);
    if (!order || order.paymentStatus === "paid" || order.status === "cancelled") return false;
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const item of items) if (item.bookId) await tx.update(books).set({ stock: sql`${books.stock} + ${item.quantity}` }).where(eq(books.id, item.bookId));
    await tx.update(orders).set({ status: "cancelled", paymentStatus: "failed" }).where(eq(orders.id, orderId));
    return true;
  });
}

/** Marks an order paid (idempotent). A payment that arrives after the order was cancelled is flagged for a manual refund. */
export async function markOrderPaid(orderId: string, reference: string | null) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update").limit(1);
    if (!order || order.paymentStatus === "paid" || order.paymentStatus === "refund_needed") return;
    await tx.update(orders).set({ paymentStatus: order.status === "cancelled" ? "refund_needed" : "paid", paymentRef: reference, paidAt: new Date() }).where(eq(orders.id, orderId));
  });
}
