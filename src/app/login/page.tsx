import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/utils";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Sign In" };
export const dynamic = "force-dynamic";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next ?? null);
  if (await getCurrentUser()) redirect(next);
  return <div className="site-container page-section"><AuthForm mode="login" next={next} /></div>;
}
