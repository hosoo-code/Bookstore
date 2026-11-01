import { db } from "@/db";
import { conversationMembers, conversations, messages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { apiError, readObject, stringValue } from "@/lib/http";
import { getConversationMember, notify } from "@/lib/social";
import { and, asc, eq } from "drizzle-orm";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const id = (await params).id;
  const access = await getConversationMember(id, user.id);
  if (!access) return apiError("Conversation not found.", 404);
  const rows = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt)).limit(150);
  await db.update(conversationMembers).set({ lastReadAt: new Date() }).where(and(eq(conversationMembers.conversationId, id), eq(conversationMembers.userId, user.id)));
  return Response.json({ messages: rows, other: { id: access.other.id, username: access.other.username, displayName: access.other.displayName, avatarUrl: access.other.avatarUrl, lastSeenAt: access.other.lastSeenAt, favoriteGenres: access.other.favoriteGenres } });
}
export async function POST(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return apiError("Please log in.", 401);
  const id = (await params).id;
  const access = await getConversationMember(id, user.id);
  if (!access) return apiError("Conversation not found.", 404);
  if (!access.other.allowMessages) return apiError("This reader is not accepting messages.", 403);
  const body = await readObject(request);
  const text = stringValue(body?.body, 2000);
  if (!text) return apiError("Message cannot be empty.");
  const [message] = await db.insert(messages).values({ conversationId: id, senderId: user.id, body: text }).returning();
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, id));
  await db.update(conversationMembers).set({ lastReadAt: new Date() }).where(and(eq(conversationMembers.conversationId, id), eq(conversationMembers.userId, user.id)));
  await notify(access.other.id, user.id, `${user.displayName} sent you a message`, `/messages/${id}`);
  return Response.json({ message }, { status: 201 });
}
