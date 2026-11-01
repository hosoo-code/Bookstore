"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Eye, EyeOff } from "lucide-react";
export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const registering = mode === "register";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, username, displayName }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      if (data.requiresConfirmation) { setConfirmation(true); return; }
      window.location.assign(next);
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto grid max-w-[920px] overflow-hidden rounded-2xl border border-[#eae3d7] bg-white shadow-[0_18px_50px_#101b3012] md:grid-cols-2">
    <div className="relative hidden min-h-[515px] flex-col justify-between bg-[#101B30] p-10 text-white md:flex" style={{ backgroundImage: "linear-gradient(180deg,rgba(16,27,48,.89),rgba(16,27,48,.64)),url('/images/library-hero.jpg')", backgroundSize: "cover", backgroundPosition: "65% center" }}><BookOpen size={33} strokeWidth={1.4} className="text-[#D8B46C]" /><div><p className="mb-4 text-xs font-bold uppercase tracking-[2px] text-[#D8B46C]">A world of stories awaits</p><h2 className="serif text-4xl leading-tight">The next chapter<br />starts with you.</h2><p className="mt-4 text-sm leading-6 text-[#d9dce1]">Find your next favorite book. Share your story with a community that understands.</p></div><span className="text-xs text-[#bfc6d0]">BookBuch ✦ Two languages. One world of books.</span></div>
    <div className="px-6 py-10 sm:px-10 md:py-12">{confirmation ? <><h1 className="serif text-3xl text-[#101B30]">Check your inbox.</h1><p className="mt-4 text-sm leading-6 text-[#777]">A confirmation email was sent to {email}. Verify your address, then sign in to your account.</p><Link href="/login" className="btn-primary mt-6">Go to Login</Link></> : <>
      <p className="page-eyebrow">{registering ? "Join the story" : "Welcome back"}</p><h1 className="serif mt-2 text-3xl text-[#101B30]">{registering ? "Create your account" : "Sign in to BookBuch"}</h1><p className="mb-7 mt-2 text-sm text-[#777]">{registering ? "A place for good books and great conversations." : "Your books and fellow readers are waiting."}</p>
      <form onSubmit={submit} className="space-y-4">{registering && <><label className="block"><span className="field-label">Display name</span><input className="form-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} maxLength={60} autoComplete="name" placeholder="Your name" /></label><label className="block"><span className="field-label">Username</span><input className="form-input" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} required minLength={3} maxLength={24} pattern="[a-z0-9_]+" autoComplete="username" placeholder="your_username" /></label></>}
        <label className="block"><span className="field-label">Email address</span><input className="form-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" /></label><label className="block"><span className="field-label">Password</span><span className="relative block"><input className="form-input pr-11" type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={registering ? 8 : undefined} autoComplete={registering ? "new-password" : "current-password"} placeholder={registering ? "At least 8 characters" : "Your password"} /><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#858585]">{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
        {error && <p role="alert" className="rounded bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        <button className="btn-primary !mt-6 w-full" type="submit" disabled={busy}>{busy ? "Please wait..." : registering ? "Create Account" : "Sign In"}<ArrowRight size={16} /></button>
      </form><p className="mt-6 text-center text-xs text-[#777]">{registering ? "Already have an account?" : "New to BookBuch?"} <Link href={registering ? `/login?next=${encodeURIComponent(next)}` : `/register?next=${encodeURIComponent(next)}`} className="font-bold text-[#9a773b] hover:underline">{registering ? "Sign in" : "Create an account"}</Link></p>
    </>}</div>
  </div>;
}
