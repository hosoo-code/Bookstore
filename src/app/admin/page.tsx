import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBooks, getCategories } from "@/lib/catalog";
import { AdminDashboard } from "@/components/admin-dashboard";
export const metadata: Metadata = { title: "Admin Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") notFound();
  const [books, categories] = await Promise.all([getBooks(), getCategories()]);
  return <div className="site-container page-section"><AdminDashboard initialBooks={books} initialCategories={categories} adminId={user.id} /></div>;
}
