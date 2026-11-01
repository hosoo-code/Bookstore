import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { conversationMembers, messages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getConversationList, getConversationMember } from "@/lib/social";
import { and, asc, eq } from "drizzle-orm";
import { ChatWindow } from "@/components/chat-window";
export const metadata: Metadata = { title: "Conversation" };
export const dynamic = "force-dynamic";
export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/messages");
  const id = (await params).conversationId;
  const access = await getConversationMember(id, user.id);
  if (!access) notFound();
  const [initialMessages, conversations] = await Promise.all([
    db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt)).limit(150),
    getConversationList(user.id),
  ]);
  await db.update(conversationMembers).set({ lastReadAt: new Date() }).where(and(eq(conversationMembers.conversationId, id), eq(conversationMembers.userId, user.id)));
  return <div className="site-container page-section !pt-7"><p className="page-eyebrow">Between the lines</p><h1 className="page-title !mb-6">Messages</h1><ChatWindow conversationId={id} userId={user.id} initialMessages={initialMessages} initialOther={{ id: access.other.id, username: access.other.username, displayName: access.other.displayName, avatarUrl: access.other.avatarUrl, lastSeenAt: access.other.lastSeenAt, favoriteGenres: access.other.favoriteGenres }} conversations={conversations} /></div>;
}
