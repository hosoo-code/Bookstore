"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Camera, Globe2, Send, UsersRound, X } from "lucide-react";
import { Avatar } from "@/components/avatar";

type User = { id: string; username: string; displayName: string; avatarUrl: string | null } | null;
export function FeedComposer({ user, books }: { user: User; books: { id: number; title: string; author: string }[] }) {
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("discussion");
  const [visibility, setVisibility] = useState("public");
  const [bookId, setBookId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  async function upload(file: File) {
    setUploading(true); setError("");
    try { const data = new FormData(); data.append("file", file); data.append("purpose", "post"); const response = await fetch("/api/upload", { method: "POST", body: data }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setImageUrl(result.url); }
    catch (err) { setError(err instanceof Error ? err.message : "Upload failed."); }
    finally { setUploading(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!body.trim()) return;
    setBusy(true); setError("");
    try { const response = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, kind, visibility, bookId: bookId ? Number(bookId) : null, imageUrl }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setBody(""); setImageUrl(""); setBookId(""); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not publish your post."); }
    finally { setBusy(false); }
  }
  if (!user) return <div className="social-card mb-5 flex items-center justify-between gap-3 p-5"><div><h2 className="serif text-xl text-[#101B30]">Have a story to share?</h2><p className="mt-1 text-xs text-[#777]">Sign in to post, comment, and meet other readers.</p></div><Link href="/login?next=/feed" className="btn-primary whitespace-nowrap">Sign In</Link></div>;
  return <form onSubmit={submit} className="social-card mb-5 p-5"><div className="flex items-start gap-3"><Avatar name={user.displayName} src={user.avatarUrl} size={43} /><textarea className="form-input min-h-[85px] resize-y !border-0 !bg-[#f8f6f1] !shadow-none" value={body} onChange={(event) => setBody(event.target.value)} placeholder="What’s on your mind? Tell us about a book..." maxLength={3000} aria-label="Write a post" /></div>
    {imageUrl && <div className="relative ml-14 mt-3 inline-block"><Image src={imageUrl} alt="Post attachment preview" width={240} height={160} className="max-h-40 w-auto rounded-lg object-cover" unoptimized={imageUrl.startsWith("http") || imageUrl.startsWith("/uploads/")} /><button type="button" onClick={() => setImageUrl("")} aria-label="Remove photo" className="absolute -right-2 -top-2 rounded-full bg-[#101B30] p-1 text-white"><X size={13} /></button></div>}
    <div className="ml-0 mt-4 flex flex-wrap items-center gap-2 border-t border-[#eeeae3] pt-4 sm:ml-14"><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file); event.target.value = ""; }} />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold text-[#667081] hover:bg-[#f8f5ef]"><Camera size={16} className="text-[#a88248]" />{uploading ? "Uploading..." : "Add Photo"}</button>
      <label className="flex items-center gap-1 text-xs font-semibold text-[#667081]"><BookOpen size={16} className="text-[#a88248]" /><select aria-label="Add a book to your post" className="max-w-[130px] cursor-pointer bg-transparent py-2 outline-none" value={bookId} onChange={(event) => setBookId(event.target.value)}><option value="">Add Book</option>{books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</select></label>
      <select value={kind} onChange={(event) => setKind(event.target.value)} aria-label="Post type" className="ml-auto cursor-pointer bg-transparent text-xs text-[#727b88] outline-none"><option value="discussion">Discussion</option><option value="review">Book Review</option></select>
      <label className="flex items-center gap-1 text-xs text-[#727b88]">{visibility === "public" ? <Globe2 size={13} /> : <UsersRound size={13} />}<select value={visibility} onChange={(event) => setVisibility(event.target.value)} aria-label="Who can see your post" className="max-w-[78px] cursor-pointer bg-transparent outline-none"><option value="public">Public</option><option value="followers">Followers</option></select></label>
      <button type="submit" disabled={busy || uploading || !body.trim()} className="btn-primary !px-4 !py-2"><Send size={14} />{busy ? "Posting..." : "Post"}</button>
    </div>{error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
  </form>;
}
