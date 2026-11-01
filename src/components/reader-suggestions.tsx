"use client";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
export function ReaderSuggestions({ people, viewerId, followingIds = [] }: { people: { id: string; username: string; displayName: string; avatarUrl: string | null; sharedGenres: string[]; favoriteGenres: string[] }[]; viewerId: string | null; followingIds?: string[] }) {
  if (!people.length) return <div className="social-card p-5"><h3 className="serif text-xl text-[#101B30]">Your people are here.</h3><p className="mt-2 text-xs leading-5 text-[#777]">Readers with shared interests will show up as our community grows.</p></div>;
  return <div className="social-card p-5"><h3 className="serif mb-4 text-xl text-[#101B30]">Readers like you</h3><div className="space-y-5">{people.slice(0, 5).map((person) => <div key={person.id} className="flex items-center gap-2"><Link href={`/profile/${person.username}`}><Avatar name={person.displayName} src={person.avatarUrl} size={37} /></Link><div className="min-w-0 flex-1"><Link href={`/profile/${person.username}`} className="block truncate text-xs font-bold text-[#101B30] hover:underline">{person.displayName}</Link><span className="block truncate text-[10px] text-[#888]">{person.sharedGenres.length ? `${person.sharedGenres[0]} in common` : `@${person.username}`}</span></div>{viewerId && <FollowButton targetId={person.id} initial={followingIds.includes(person.id)} compact />}</div>)}</div></div>;
}
