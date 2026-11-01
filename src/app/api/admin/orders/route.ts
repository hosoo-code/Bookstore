import { db } from "@/db";
import { books, orderItems, orders, profiles } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { isUuid, apiError, readObject } from "@/lib/http";
import { desc, eq, sql } from "drizzle-orm";

export async function GET() {
  if (!(await isAdmin())) return apiError("Admin access required.", 403);
  const rows = await db.select({ order: orders, customer: { username: profiles.username, email: profiles.email } }).from(orders)
    .innerJoin(profiles, eq(orders.userId, profiles.id)).orderBy(desc(orders.createdAt)).limit(100);
  return Response.json({ orders: rows });
}
export async function PATCH(request: Request) {
  if (!(await isAdmin())) return apiError("Admin access required.", 403);
  const body = await readObject(request);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = typeof body?.status === "string" ? body.status : "";
  if (!isUuid(id) || !["pending", "processing", "shipped", "delivered", "cancelled"].includes(status)) return apiError("Invalid order status.");
  try {
    const updated = await db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update").limit(1);
      if (!order) throw new Error("Order not found.");
      if (order.status === "cancelled" && status !== "cancelled") throw new Error("Cancelled orders cannot be reopened.");
      if (status === "cancelled" && order.status !== "cancelled") {
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, id));
        for (const item of items) if (item.bookId) await tx.update(books).set({ stock: sql`${books.stock} + ${item.quantity}` }).where(eq(books.id, item.bookId));
      }
      const paid = status === "delivered" && order.paymentMethod === "cash_on_delivery" && order.paymentStatus !== "paid" ? { paymentStatus: "paid", paidAt: new Date() } : {};
      const [result] = await tx.update(orders).set({ status, ...paid }).where(eq(orders.id, id)).returning();
      return result;
    });
    return Response.json({ order: updated });
  } catch (error) { return apiError(error instanceof Error ? error.message : "Could not update order.", 400); }
}
