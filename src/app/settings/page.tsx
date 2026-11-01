import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles, userBlocks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/catalog";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/settings-form";
export const metadata: Metadata = { title: "Profile Settings" };
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");
  const blocked = await db.select({ id: profiles.id, username: profiles.username, displayName: profiles.displayName }).from(userBlocks)
    .innerJoin(profiles, eq(userBlocks.blockedId, profiles.id)).where(eq(userBlocks.blockerId, user.id));
  const genres = await getCategories();
  return <div className="site-container page-section"><SettingsForm genres={genres} initial={{ username: user.username, displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl, coverUrl: user.coverUrl, favoriteGenres: user.favoriteGenres, favoriteAuthors: user.favoriteAuthors, allowMessages: user.allowMessages }} blockedInitial={blocked} /></div>;
}
