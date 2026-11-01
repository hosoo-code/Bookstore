import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, MessageCircle, UsersRound } from "lucide-react";
import { db } from "@/db";
import { userFollows } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getBooks } from "@/lib/catalog";
import { getFeed, getSuggestedPeople } from "@/lib/social";
import { eq } from "drizzle-orm";
import { FeedComposer } from "@/components/feed-composer";
import { FeedPostCard } from "@/components/feed-post-card";
import { ReaderSuggestions } from "@/components/reader-suggestions";
import { ScrollToPost } from "@/components/scroll-to-post";

export const metadata: Metadata = { title: "Reader Feed", description: "Share book reviews, discover recommendations, and connect with other BookBuch readers." };
export const dynamic = "force-dynamic";
const tabs = [{ id: "for-you", name: "For You" }, { id: "following", name: "Following" }, { id: "reviews", name: "Book Reviews" }, { id: "discussions", name: "Discussions" }];
export default async function FeedPage({ searchParams }: { searchParams: Promise<{ tab?: string; post?: string }> }) {
  const params = await searchParams;
  const tab = tabs.some((item) => item.id === params.tab) ? params.tab! : "for-you";
  const user = await getCurrentUser();
  const [items, books, people, follows] = await Promise.all([
    getFeed(user?.id ?? null, tab), getBooks(), getSuggestedPeople(user?.id ?? null, user?.favoriteGenres ?? []),
    user ? db.select({ id: userFollows.followingId }).from(userFollows).where(eq(userFollows.followerId, user.id)) : Promise.resolve([] as { id: string }[]),
  ]);
  return <div className="site-container page-section"><div className="mb-8"><p className="page-eyebrow">A place for book people</p><h1 className="page-title">The Reading Feed</h1><p className="page-description">Your corner of the book world. Share your thoughts, discover new stories, and find your people.</p></div>
    <div className="social-layout"><div className="min-w-0"><FeedComposer user={user ? { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl } : null} books={books.map(({ id, title, author }) => ({ id, title, author }))} />
      <nav className="social-card tab-strip mb-5 px-2" aria-label="Feed categories">{tabs.map((item) => <Link key={item.id} href={item.id === "for-you" ? "/feed" : `/feed?tab=${item.id}`} className={`tab-link ${tab === item.id ? "active" : ""}`}>{item.name}</Link>)}</nav>
      {items.length ? items.map((post) => <FeedPostCard key={post.id} post={post} viewerId={user?.id ?? null} />) : <div className="social-card px-6 py-14 text-center"><BookOpen size={32} className="mx-auto text-[#bda06b]" strokeWidth={1.4} /><h2 className="serif mt-4 text-2xl text-[#101B30]">A fresh page awaits.</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#777]">{tab === "following" ? "Follow readers to see their posts here." : "No posts here yet. Be the first to share a book you love."}</p>{!user && <Link href="/register?next=/feed" className="btn-primary mt-5">Join the Conversation</Link>}</div>}
    </div><aside className="space-y-5"><ReaderSuggestions people={people} viewerId={user?.id ?? null} followingIds={follows.map((item) => item.id)} /><div className="social-card p-5"><p className="page-eyebrow">Connect</p><h3 className="serif mt-2 text-xl text-[#101B30]">Better together.</h3><p className="mt-2 text-xs leading-5 text-[#777]">Find a reading buddy, start a conversation, and never run out of recommendations.</p><div className="mt-4 flex flex-col gap-2"><Link href="/messages" className="flex items-center gap-2 text-xs font-semibold text-[#101B30]"><MessageCircle size={15} className="text-[#a98749]" /> Your Messages</Link><Link href="/books" className="flex items-center gap-2 text-xs font-semibold text-[#101B30]"><UsersRound size={15} className="text-[#a98749]" /> Explore Books</Link></div></div></aside></div>
    {params.post && <ScrollToPost id={params.post} />}
  </div>;
}
