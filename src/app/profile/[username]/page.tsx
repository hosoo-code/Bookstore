import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { areBlocked } from "@/lib/social";
import { eq } from "drizzle-orm";
import { ProfileContent } from "@/components/profile-content";

type Context = { params: Promise<{ username: string }> };
export async function generateMetadata({ params }: Context): Promise<Metadata> {
  const [profile] = await db.select({ displayName: profiles.displayName, bio: profiles.bio }).from(profiles).where(eq(profiles.username, (await params).username)).limit(1);
  return { title: profile ? `${profile.displayName}'s Profile` : "Reader Profile", description: profile?.bio || "Meet readers on BookBuch." };
}
export const dynamic = "force-dynamic";
export default async function ReaderProfilePage({ params }: Context) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.username, (await params).username)).limit(1);
  if (!profile) notFound();
  const viewer = await getCurrentUser();
  if (viewer && viewer.id !== profile.id && await areBlocked(viewer.id, profile.id)) notFound();
  return <ProfileContent profile={profile} viewer={viewer} />;
}
