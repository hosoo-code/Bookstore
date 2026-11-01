import { db } from "@/db";
import { orders } from "@/db/schema";
import { isUuid } from "@/lib/http";
import { verifyBonumChecksum } from "@/lib/bonum";
import { cancelUnpaidOrder, markOrderPaid } from "@/lib/orders";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyBonumChecksum(raw, request.headers.get("x-checksum-v2"))) return new Response("Invalid signature", { status: 401 });
  let event: Record<string, any>;
  try { event = JSON.parse(raw); } catch { return new Response("Bad request", { status: 400 }); }
  const payload = event.body ?? event.data ?? event.payload ?? event;
  const type = String(event.type ?? payload.type ?? "").toUpperCase();
  const status = String(event.status ?? payload.status ?? "").toUpperCase();
  const transactionId = String(payload.transactionId ?? event.transactionId ?? "");
  if (type !== "PAYMENT" || !isUuid(transactionId)) return new Response("ignored", { status: 200 });
  const [order] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, transactionId)).limit(1);
  if (!order) return new Response("ignored", { status: 200 });
  if (status === "SUCCESS") await markOrderPaid(order.id, String(payload.paymentId ?? payload.invoiceId ?? payload.id ?? "") || null);
  else if (status === "FAILED") await cancelUnpaidOrder(order.id);
  return new Response("ok", { status: 200 });
}
