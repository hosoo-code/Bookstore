import { db } from "@/db";
import { books, cartItems, orderItems, orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { apiError, readObject, stringValue } from "@/lib/http";
import { and, eq, gte, inArray, sql } from "drizzle-orm";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in to place an order.", 401);
  const body = await readObject(request);
  const name = stringValue(body?.name, 100);
  const address = stringValue(body?.address, 500);
  const phone = stringValue(body?.phone, 40);
  if (name.length < 2 || address.length < 8 || phone.length < 6) return apiError("Enter your name, complete delivery address, and phone number.");
  if (!Array.isArray(body?.items) || !body.items.length || body.items.length > 50) return apiError("Your cart is empty.");
  const items = body.items.map((item: unknown) => {
    if (!item || typeof item !== "object") return null;
    const value = item as Record<string, unknown>;
    return { bookId: Number(value.bookId), quantity: Number(value.quantity) };
  });
  if (items.some((item) => !item || !Number.isSafeInteger(item.bookId) || item.bookId < 1 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10)) return apiError("Invalid cart items.");
  const validItems = items as { bookId: number; quantity: number }[];
  if (new Set(validItems.map((item) => item.bookId)).size !== validItems.length) return apiError("Duplicate cart items.");
  try {
    const order = await db.transaction(async (tx) => {
      const available = await tx.select().from(books).where(inArray(books.id, validItems.map((item) => item.bookId)));
      const bookMap = new Map(available.map((book) => [book.id, book]));
      if (available.length !== validItems.length) throw new Error("A book in your cart is no longer available.");
      const totalCents = validItems.reduce((total, item) => total + bookMap.get(item.bookId)!.priceCents * item.quantity, 0);
      for (const item of validItems) {
        const [updated] = await tx.update(books).set({ stock: sql`${books.stock} - ${item.quantity}` })
          .where(and(eq(books.id, item.bookId), gte(books.stock, item.quantity))).returning({ id: books.id });
        if (!updated) throw new Error(`${bookMap.get(item.bookId)!.title} is out of stock.`);
      }
      const [created] = await tx.insert(orders).values({ userId: user.id, totalCents, shippingName: name, shippingAddress: address, shippingPhone: phone, paymentMethod: "cash_on_delivery" }).returning();
      await tx.insert(orderItems).values(validItems.map((item) => ({ orderId: created.id, bookId: item.bookId, title: bookMap.get(item.bookId)!.title, quantity: item.quantity, unitPriceCents: bookMap.get(item.bookId)!.priceCents })));
      await tx.delete(cartItems).where(eq(cartItems.userId, user.id));
      return created;
    });
    return Response.json({ order }, { status: 201 });
  } catch (error) { return apiError(error instanceof Error ? error.message : "Could not place your order.", 409); }
}
