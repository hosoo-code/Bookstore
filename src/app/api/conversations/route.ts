import { db } from "@/db";
import { conversationMembers, conversations, profiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { apiError, readObject, stringValue } from "@/lib/http";
import { areBlocked, getConversationList } from "@/lib/social";
import { and, eq } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  return Response.json({ conversations: await getConversationList(user.id) });
}
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in to chat.", 401);
  const body = await readObject(request);
  const username = stringValue(body?.username, 24).toLowerCase();
  const [target] = await db.select().from(profiles).where(eq(profiles.username, username)).limit(1);
  if (!target || target.id === user.id) return apiError("Reader not found.", 404);
  if (!target.allowMessages || await areBlocked(user.id, target.id)) return apiError("This reader is not accepting messages.", 403);
  const mine = await db.select({ conversationId: conversationMembers.conversationId }).from(conversationMembers).where(eq(conversationMembers.userId, user.id));
  for (const item of mine) {
    const [peer] = await db.select().from(conversationMembers).where(and(eq(conversationMembers.conversationId, item.conversationId), eq(conversationMembers.userId, target.id))).limit(1);
    if (peer) return Response.json({ id: item.conversationId });
  }
  const id = await db.transaction(async (tx) => {
    const [conversation] = await tx.insert(conversations).values({}).returning();
    await tx.insert(conversationMembers).values([
      { conversationId: conversation.id, userId: user.id },
      { conversationId: conversation.id, userId: target.id },
    ]);
    return conversation.id;
  });
  return Response.json({ id }, { status: 201 });
}
