"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import type { Message } from "@/db/schema";
import type { getConversationList } from "@/lib/social";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/avatar";
import { ChatList } from "@/components/chat-list";
type Conversation = Awaited<ReturnType<typeof getConversationList>>[number];
type Other = { id: string; username: string; displayName: string; avatarUrl: string | null; lastSeenAt: Date | string | null; favoriteGenres: string[] };
export function ChatWindow({ conversationId, userId, initialMessages, initialOther, conversations }: { conversationId: string; userId: string; initialMessages: Message[]; initialOther: Other; conversations: Conversation[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [other, setOther] = useState<Other>(initialOther);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const online = other.lastSeenAt && Date.now() - new Date(other.lastSeenAt).getTime() < 120000;
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages.length]);
  useEffect(() => {
    let active = true;
    async function refresh() {
      try { const response = await fetch(`/api/conversations/${conversationId}/messages`, { cache: "no-store" }); if (response.ok && active) { const data = await response.json(); setMessages(data.messages); setOther(data.other); } }
      catch { /* Retry on next poll. */ }
    }
    const supabase = getSupabaseBrowserClient();
    const channel = supabase?.channel(`bookbuch-chat-${conversationId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, refresh).subscribe();
    refresh();
    fetch("/api/presence", { method: "POST" });
    const poll = window.setInterval(refresh, 5000);
    const presence = window.setInterval(() => fetch("/api/presence", { method: "POST" }), 40000);
    return () => { active = false; window.clearInterval(poll); window.clearInterval(presence); if (channel && supabase) void supabase.removeChannel(channel); };
  }, [conversationId]);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!text.trim()) return; setBusy(true); setError("");
    try { const response = await fetch(`/api/conversations/${conversationId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setMessages((current) => current.some((item) => item.id === data.message.id) ? current : [...current, data.message]); setText(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not send message."); }
    finally { setBusy(false); }
  }
  return <div className="social-card chat-layout"><aside className="chat-sidebar"><ChatList conversations={conversations} active={conversationId} /></aside><div className="chat-thread"><div className="flex items-center gap-3 border-b border-[#eee8df] px-4 py-3.5"><Link href="/messages" className="text-[#868b92] lg:hidden" aria-label="Back to messages"><ArrowLeft size={19} /></Link><Link href={`/profile/${other.username}`}><Avatar name={other.displayName} src={other.avatarUrl} size={39} /></Link><div className="min-w-0 flex-1"><Link href={`/profile/${other.username}`} className="text-sm font-bold text-[#101B30]">{other.displayName}</Link><p className={`mt-0.5 text-[11px] ${online ? "text-[#5e9568]" : "text-[#999]"}`}>{online ? "● Online" : "Offline"}</p></div><Link href={`/profile/${other.username}`} className="text-xs font-semibold text-[#9f7c43]">View profile</Link></div>
    <div ref={scrollRef} className="chat-messages"><p className="mb-6 text-center text-[11px] text-[#aaa]">Your conversation is private. Only you and {other.displayName} can see these messages.</p>{messages.length ? messages.map((message) => <div key={message.id} className={`mb-3 flex ${message.senderId === userId ? "justify-end" : "justify-start"}`}><div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${message.senderId === userId ? "rounded-br-sm bg-[#101B30] text-white" : "rounded-bl-sm bg-[#f2eee7] text-[#354052]"}`}><p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p><p className={`mt-1 text-right text-[10px] ${message.senderId === userId ? "text-[#b9c4d2]" : "text-[#999]"}`} title={new Date(message.createdAt).toLocaleString()}>{timeAgo(message.createdAt)}</p></div></div>) : <div className="py-16 text-center"><p className="serif text-xl text-[#101B30]">A conversation starts with hello.</p><p className="mt-2 text-xs text-[#888]">Ask what they’re reading lately.</p></div>}</div>
    <form onSubmit={send} className="border-t border-[#eee8df] p-3 sm:p-4"><div className="flex items-center gap-2"><input className="form-input !rounded-full" placeholder="Write a message..." aria-label="Write a message" value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} /><button type="submit" disabled={busy || !text.trim()} className="btn-primary !h-10 !w-10 !rounded-full !p-0" aria-label="Send message"><Send size={17} /></button></div>{error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}</form>
  </div></div>;
}
