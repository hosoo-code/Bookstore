"use client";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Send } from "lucide-react";
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try { const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, message }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSent(true); setMessage(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not send message."); }
    finally { setBusy(false); }
  }
  if (sent) return <div className="panel p-8 text-center"><CheckCircle2 size={36} className="mx-auto text-[#719073]" /><h2 className="serif mt-4 text-2xl text-[#101B30]">Message received.</h2><p className="mt-2 text-sm text-[#777]">Thank you for getting in touch. Your message has been delivered to the BookBuch team.</p><button type="button" className="btn-outline mt-5" onClick={() => setSent(false)}>Send another message</button></div>;
  return <form onSubmit={submit} className="panel space-y-5 p-6 md:p-8"><h2 className="serif text-2xl text-[#101B30]">Send us a message</h2><div className="grid gap-4 sm:grid-cols-2"><label><span className="field-label">Your name</span><input className="form-input" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label><label><span className="field-label">Email address</span><input className="form-input" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label></div><label className="block"><span className="field-label">How can we help?</span><textarea className="form-input min-h-36" required minLength={10} maxLength={3000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us what’s on your mind..." /></label>{error && <p role="alert" className="text-xs text-red-600">{error}</p>}<button type="submit" className="btn-primary" disabled={busy}><Send size={15} />{busy ? "Sending..." : "Send Message"}</button></form>;
}
