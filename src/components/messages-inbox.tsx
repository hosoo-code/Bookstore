"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import type { getConversationList, getSuggestedPeople } from "@/lib/social";
import { Avatar } from "@/components/avatar";
import { ChatList } from "@/components/chat-list";
type Conversation = Awaited<ReturnType<typeof getConversationList>>[number];
type Person = Awaited<ReturnType<typeof getSuggestedPeople>>[number];
export function MessagesInbox({ conversations, people }: { conversations: Conversation[]; people: Person[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function start(username: string) {
    setBusy(username); setError("");
    try { const response = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); router.push(`/messages/${data.id}`); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not start conversation."); }
    finally { setBusy(""); }
  }
  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="social-card overflow-hidden"><ChatList conversations={conversations} />{!conversations.length && <div className="p-5 text-center"><MessageCircle className="mx-auto text-[#baa06f]" size={28} /><p className="mt-2 text-sm text-[#777]">Good stories start with a hello.</p></div>}</div>
    <aside className="social-card p-5"><p className="page-eyebrow">Your reading circle</p><h2 className="serif mt-2 text-2xl text-[#101B30]">Meet your people</h2><p className="mt-2 text-xs leading-5 text-[#888]">Readers with shared book interests are a great place to start.</p><div className="mt-5 space-y-4">{people.length ? people.map((person) => <div key={person.id} className="flex items-center gap-3"><Link href={`/profile/${person.username}`}><Avatar name={person.displayName} src={person.avatarUrl} size={39} /></Link><div className="min-w-0 flex-1"><Link href={`/profile/${person.username}`} className="block truncate text-xs font-bold text-[#101B30]">{person.displayName}</Link><p className="mt-1 truncate text-[10px] text-[#888]">{person.sharedGenres.length ? `${person.sharedGenres.join(", ")} in common` : `@${person.username}`}</p></div><button type="button" onClick={() => start(person.username)} disabled={busy === person.username || !person.allowMessages} className="grid h-8 w-8 place-items-center rounded-full border border-[#e7ded0] text-[#a17b38] hover:bg-[#f8f5ef]" title={person.allowMessages ? "Start a conversation" : "Messages disabled"} aria-label={`Message ${person.displayName}`}><ArrowRight size={15} /></button></div>) : <div className="rounded-lg bg-[#f8f5ef] p-5 text-center"><Sparkles size={20} className="mx-auto text-[#b99a5c]" /><p className="mt-2 text-xs text-[#888]">More readers will appear as our community grows.</p></div>}</div>{error && <p role="alert" className="mt-4 text-xs text-red-600">{error}</p>}</aside>
  </div>;
}
