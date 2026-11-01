import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { apiError, readObject, stringValue } from "@/lib/http";
export async function POST(request: Request) {
  const body = await readObject(request);
  const name = stringValue(body?.name, 100);
  const email = stringValue(body?.email, 254);
  const message = stringValue(body?.message, 3000);
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) return apiError("Please fill in your name, email, and a message of at least 10 characters.");
  await db.insert(contactMessages).values({ name, email, message });
  return Response.json({ ok: true }, { status: 201 });
}
