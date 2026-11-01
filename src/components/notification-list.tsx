"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { timeAgo } from "@/lib/utils";
type Notice = { id: string; text: string; href: string; readAt: Date | string | null; createdAt: Date | string; actor: { username: string; displayName: string; avatarUrl: string | null } | null };
export function NotificationList({ initial }: { initial: Notice[] }) {
  const [notices, setNotices] = useState(initial);
  const router = useRouter();
  async function mark(id?: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id } : {}) });
    setNotices((current) => current.map((item) => !id || item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    router.refresh();
  }
  return <div className="mx-auto max-w-2xl"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="page-eyebrow">Stay in the loop</p><h1 className="page-title !mb-0">Notifications</h1></div>{notices.some((item) => !item.readAt) && <button type="button" onClick={() => mark()} className="text-arrow"><CheckCheck size={16} /> Mark all read</button>}</div>
    <div className="social-card overflow-hidden">{notices.length ? notices.map((notice) => <Link key={notice.id} href={notice.href} onClick={() => { if (!notice.readAt) void mark(notice.id); }} className={`flex items-center gap-4 border-b border-[#f0ebe4] p-5 hover:bg-[#fbf8f3] ${!notice.readAt ? "bg-[#faf5e9]" : ""}`}><Avatar name={notice.actor?.displayName || "BookBuch"} src={notice.actor?.avatarUrl} size={42} /><span className="min-w-0 flex-1"><span className="block text-sm text-[#384353]">{notice.text}</span><span className="mt-1 block text-[11px] text-[#999]">{timeAgo(notice.createdAt)}</span></span>{!notice.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-[#bf9551]" />}</Link>) : <div className="px-6 py-16 text-center"><Bell size={30} className="mx-auto text-[#c0a572]" /><h2 className="serif mt-4 text-xl text-[#101B30]">All caught up.</h2><p className="mt-2 text-sm text-[#888]">Likes, follows, comments, and messages will show up here.</p></div>}</div>
  </div>;
}
