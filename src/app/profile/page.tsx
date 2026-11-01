import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProfileContent } from "@/components/profile-content";
export const metadata: Metadata = { title: "My Profile" };
export const dynamic = "force-dynamic";
export default async function MyProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");
  return <ProfileContent profile={user} viewer={user} />;
}
