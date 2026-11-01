"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Flag, MessageCircle, Settings, ShieldBan, LogOut } from "lucide-react";
import { FollowButton } from "@/components/follow-button";
export function ProfileActions({ targetId, username, own, viewerId, following, allowMessages, admin }: { targetId: string; username: string; own: boolean; viewerId: string | null; following: boolean; allowMessages: boolean; admin?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function message() {
    if (!viewerId) { router.push(`/login?next=/profile/${username}`); return; }
    setBusy(true); setError("");
    try { const response = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); router.push(`/messages/${data.id}`); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not start a chat."); }
    finally { setBusy(false); }
  }
  async function block() {
    if (!viewerId) { router.push("/login"); return; }
    if (!window.confirm(`Block @${username}? You will not be able to see or message each other.`)) return;
    const response = await fetch("/api/blocks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId }) });
    if (response.ok) router.push("/settings"); else setError((await response.json()).error);
  }
  async function report() {
    if (!viewerId) { router.push("/login"); return; }
    const reason = window.prompt("Why are you reporting this reader? Your report stays private.");
    if (!reason) return;
    const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUserId: targetId, reason }) });
    setError(response.ok ? "Report submitted to our team." : (await response.json()).error);
  }
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }
  return <div className="flex flex-wrap items-center justify-end gap-2">
    {own ? <><Link href="/settings" className="btn-outline"><Settings size={15} /> Edit Profile</Link>{admin && <Link href="/admin" className="btn-outline">Admin</Link>}<button type="button" className="btn-outline" onClick={signOut}><LogOut size={15} /> Sign Out</button></> : <>
      {viewerId ? <FollowButton targetId={targetId} initial={following} /> : <Link href={`/login?next=/profile/${username}`} className="btn-primary">Follow</Link>}
      <button type="button" className="btn-outline" onClick={message} disabled={!allowMessages || busy} title={!allowMessages ? "This reader is not accepting messages" : undefined}><MessageCircle size={15} /> Message</button>
      {viewerId && <details className="relative"><summary className="btn-outline list-none cursor-pointer !px-3" aria-label="More profile actions">···</summary><div className="absolute right-0 top-11 z-20 min-w-36 rounded-lg border border-[#e8e1d6] bg-white p-1 shadow-lg"><button type="button" onClick={report} className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs hover:bg-[#f8f5ef]"><Flag size={14} /> Report</button><button type="button" onClick={block} className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs text-red-600 hover:bg-red-50"><ShieldBan size={14} /> Block</button></div></details>}
    </>}{error && <p role="status" className="w-full text-right text-xs text-[#a17b38]">{error}</p>}
  </div>;
}
