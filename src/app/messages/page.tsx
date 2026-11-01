import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getConversationList, getSuggestedPeople } from "@/lib/social";
import { MessagesInbox } from "@/components/messages-inbox";
export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";
export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/messages");
  const [conversations, people] = await Promise.all([getConversationList(user.id), getSuggestedPeople(user.id, user.favoriteGenres)]);
  return <div className="site-container page-section"><p className="page-eyebrow">Between the lines</p><h1 className="page-title">Messages</h1><p className="page-description mb-7">The best recommendations come from a good conversation.</p><MessagesInbox conversations={conversations} people={people} /></div>;
}
