import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { notifications, profiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import { NotificationList } from "@/components/notification-list";
export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";
export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notifications");
  const rows = await db.select({ notice: notifications, actor: { username: profiles.username, displayName: profiles.displayName, avatarUrl: profiles.avatarUrl } }).from(notifications)
    .leftJoin(profiles, eq(notifications.actorId, profiles.id)).where(eq(notifications.recipientId, user.id)).orderBy(desc(notifications.createdAt)).limit(80);
  return <div className="site-container page-section"><NotificationList initial={rows.map(({ notice, actor }) => ({ ...notice, actor }))} /></div>;
}
