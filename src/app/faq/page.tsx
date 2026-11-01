import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Frequently Asked Questions" };
const questions = [
  { q: "What languages are available?", a: "BookBuch offers a growing selection of English and German books. Use the language filter on the Books page to explore each collection." },
  { q: "How does checkout work?", a: "After signing in, add books to your cart and enter your delivery details at checkout. Orders are placed as pending with cash on delivery. We do not collect card details or charge you online." },
  { q: "Where can I see my orders?", a: "Sign in and visit your profile. Your order history and current order status appear under Order History." },
  { q: "Can I change what I share with other readers?", a: "Yes. When writing a post, choose Public or Followers. Visit Settings to edit your profile and turn off incoming messages whenever you like." },
  { q: "How do I save a book or track my reading?", a: "Use the heart on any book card to save a favorite. On a book’s detail page, add it to Currently Reading or mark it as read. Your shelves appear on your profile." },
  { q: "What happens when I block or report someone?", a: "Blocking prevents the two of you from viewing each other’s posts or exchanging messages. Reports are saved privately for an administrator to review." },
];
export default function FAQPage() { return <div className="site-container page-section"><div className="mx-auto max-w-3xl"><p className="page-eyebrow">Good to know</p><h1 className="page-title">Frequently Asked Questions</h1><p className="page-description mb-8">A few answers to help you make yourself at home.</p><div className="space-y-3">{questions.map(({ q, a }) => <details key={q} className="panel group p-5"><summary className="cursor-pointer list-none pr-5 text-sm font-bold text-[#101B30]">{q} <span className="float-right text-[#b3945c] group-open:rotate-45">+</span></summary><p className="mt-4 text-sm leading-7 text-[#67717d]">{a}</p></details>)}</div><p className="mt-8 text-sm text-[#777]">Still curious? <Link href="/contact" className="font-bold text-[#9f7c43]">Contact our team →</Link></p></div></div>; }
