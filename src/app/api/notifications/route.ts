import { db } from "@/db";
import { notifications, profiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isUuid, apiError, readObject } from "@/lib/http";
import { and, desc, eq, isNull } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const rows = await db.select({ notification: notifications, actor: { username: profiles.username, displayName: profiles.displayName, avatarUrl: profiles.avatarUrl } })
    .from(notifications).leftJoin(profiles, eq(notifications.actorId, profiles.id)).where(eq(notifications.recipientId, user.id)).orderBy(desc(notifications.createdAt)).limit(80);
  return Response.json({ notifications: rows.map(({ notification, actor }) => ({ ...notification, actor })) });
}
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const body = await readObject(request);
  const id = typeof body?.id === "string" ? body.id : null;
  if (id && !isUuid(id)) return apiError("Invalid notification.");
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.recipientId, user.id), isNull(notifications.readAt), id ? eq(notifications.id, id) : undefined));
  return Response.json({ ok: true });
}
