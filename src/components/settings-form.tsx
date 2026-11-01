"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Camera, LockKeyhole, Save, ShieldBan } from "lucide-react";
import { Avatar } from "@/components/avatar";

type SettingsProfile = { username: string; displayName: string; bio: string; avatarUrl: string | null; coverUrl: string | null; favoriteGenres: string[]; favoriteAuthors: string[]; allowMessages: boolean };
type Blocked = { id: string; username: string; displayName: string };
export function SettingsForm({ initial, blockedInitial, genres }: { initial: SettingsProfile; blockedInitial: Blocked[]; genres: { slug: string; name: string }[] }) {
  const [profile, setProfile] = useState(initial);
  const [authors, setAuthors] = useState(initial.favoriteAuthors.join(", "));
  const [blocked, setBlocked] = useState(blockedInitial);
  const [uploading, setUploading] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  async function upload(file: File, purpose: "avatar" | "cover") {
    setUploading(purpose); setMessage("");
    try { const data = new FormData(); data.append("file", file); data.append("purpose", purpose); const response = await fetch("/api/upload", { method: "POST", body: data }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setProfile((current) => ({ ...current, [purpose === "avatar" ? "avatarUrl" : "coverUrl"]: result.url })); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Upload failed."); }
    finally { setUploading(""); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...profile, favoriteAuthors: authors.split(",").map((item) => item.trim()).filter(Boolean) }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setMessage("Profile saved successfully."); router.refresh(); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Could not save profile."); }
    finally { setBusy(false); }
  }
  async function unblock(id: string) { const response = await fetch("/api/blocks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId: id }) }); if (response.ok) setBlocked((current) => current.filter((person) => person.id !== id)); }
  return <div className="mx-auto max-w-3xl"><Link href="/profile" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#777]"><ArrowLeft size={14} /> Back to profile</Link><p className="page-eyebrow">Your space</p><h1 className="page-title mb-7">Profile Settings</h1>
    <form onSubmit={submit} className="space-y-5"><div className="panel overflow-hidden"><div className="profile-cover relative !h-40">{profile.coverUrl && <Image src={profile.coverUrl} alt="Your cover" fill className="object-cover" unoptimized={profile.coverUrl.startsWith("http") || profile.coverUrl.startsWith("/uploads/")} />}</div><div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-6"><div className="-mt-8 flex items-end gap-4"><div className="relative rounded-full border-4 border-white"><Avatar name={profile.displayName} src={profile.avatarUrl} size={72} /></div><div className="pb-1"><p className="text-sm font-bold text-[#101B30]">{profile.displayName}</p><p className="text-xs text-[#888]">@{profile.username}</p></div></div><div className="flex gap-2"><input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file, "avatar"); event.target.value = ""; }} /><input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file, "cover"); event.target.value = ""; }} /><button type="button" className="btn-outline" disabled={Boolean(uploading)} onClick={() => avatarRef.current?.click()}><Camera size={14} /> {uploading === "avatar" ? "Uploading..." : "Photo"}</button><button type="button" className="btn-outline" disabled={Boolean(uploading)} onClick={() => coverRef.current?.click()}><Camera size={14} /> {uploading === "cover" ? "Uploading..." : "Cover"}</button></div></div></div>
      <div className="panel space-y-5 p-6 md:p-8"><h2 className="serif text-2xl text-[#101B30]">About you</h2><div className="grid gap-5 sm:grid-cols-2"><label><span className="field-label">Display name</span><input className="form-input" value={profile.displayName} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} minLength={2} required /></label><label><span className="field-label">Username</span><input className="form-input" value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value.toLowerCase() })} minLength={3} pattern="[a-z0-9_]+" required /></label></div><label className="block"><span className="field-label">Bio</span><textarea className="form-input min-h-24" maxLength={500} value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} placeholder="Tell other readers a little about yourself..." /></label><div><span className="field-label">Favorite genres</span><div className="mt-2 flex flex-wrap gap-2">{genres.map((category) => <button key={category.slug} type="button" onClick={() => setProfile((current) => ({ ...current, favoriteGenres: current.favoriteGenres.includes(category.slug) ? current.favoriteGenres.filter((genre) => genre !== category.slug) : [...current.favoriteGenres, category.slug] }))} className={`rounded-full border px-3 py-2 text-xs ${profile.favoriteGenres.includes(category.slug) ? "border-[#c9a86a] bg-[#f0e3ca] text-[#101B30]" : "border-[#ded8cc] text-[#687282]"}`}>{category.name}</button>)}</div></div><label className="block"><span className="field-label">Favorite authors <span className="font-normal text-[#999]">(separate with commas)</span></span><input className="form-input" value={authors} onChange={(event) => setAuthors(event.target.value)} placeholder="Jane Austen, Frank Herbert..." /></label></div>
      <div className="panel p-6 md:p-8"><h2 className="serif flex items-center gap-2 text-2xl text-[#101B30]"><LockKeyhole size={20} className="text-[#b29153]" /> Privacy & messages</h2><label className="mt-5 flex cursor-pointer items-center justify-between gap-4"><span><strong className="block text-sm text-[#101B30]">Allow messages from other readers</strong><small className="mt-1 block text-xs text-[#888]">Turn this off whenever you need a little quiet time.</small></span><input type="checkbox" checked={profile.allowMessages} onChange={(event) => setProfile({ ...profile, allowMessages: event.target.checked })} className="h-5 w-5 accent-[#101B30]" /></label></div>
      <div className="flex flex-wrap items-center justify-between gap-3">{message && <p role="status" className="text-xs text-[#876a39]">{message}</p>}<button type="submit" disabled={busy || Boolean(uploading)} className="btn-primary ml-auto"><Save size={15} /> {busy ? "Saving..." : "Save Changes"}</button></div>
    </form>
    <div className="panel mt-6 p-6"><h2 className="serif flex items-center gap-2 text-xl text-[#101B30]"><ShieldBan size={17} className="text-[#b29153]" /> Blocked readers</h2>{blocked.length ? blocked.map((person) => <div key={person.id} className="mt-4 flex items-center justify-between gap-3 border-t border-[#eee8df] pt-3"><span className="text-xs text-[#4a5666]">{person.displayName} (@{person.username})</span><button type="button" onClick={() => unblock(person.id)} className="text-xs font-bold text-[#9d7738]">Unblock</button></div>) : <p className="mt-3 text-xs text-[#888]">You haven’t blocked anyone.</p>}</div>
  </div>;
}
