import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { desc } from "drizzle-orm";
export async function GET() {
  if (!(await isAdmin())) return apiError("Admin access required.", 403);
  return Response.json({ messages: await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(100) });
}
