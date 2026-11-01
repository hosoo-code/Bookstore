"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BookOpen, House, Newspaper, Search, UserRound } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { useLocale } from "@/components/locale-provider";

type TabUser = { displayName: string; avatarUrl: string | null } | null;

function Tabs({ user }: { user: TabUser }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const searching = useSearchParams().get("focus") === "search";
  const onBooks = pathname === "/books" || pathname.startsWith("/books/") || pathname.startsWith("/categories");
  const items = [
    { href: "/", label: t("nav.home"), Icon: House, active: pathname === "/" },
    { href: "/books", label: t("nav.books"), Icon: BookOpen, active: onBooks && !searching },
    { href: "/feed", label: t("nav.feed"), Icon: Newspaper, active: pathname.startsWith("/feed") },
    { href: "/books?focus=search", label: t("nav.search"), Icon: Search, active: pathname === "/books" && searching },
  ];
  const profileActive = pathname.startsWith("/profile") || pathname === "/login" || pathname === "/settings";
  return <nav className="tab-bar" aria-label={t("nav.quick")}>
    {items.map(({ href, label, Icon, active }) => <Link key={label} href={href} className={`tab-item ${active ? "active" : ""}`} aria-label={label} aria-current={active ? "page" : undefined}>
      <Icon size={24} strokeWidth={active ? 2.3 : 1.7} />
    </Link>)}
    <Link href={user ? "/profile" : "/login"} className={`tab-item ${profileActive ? "active" : ""}`} aria-label={user ? t("nav.profile") : t("nav.login")} aria-current={profileActive ? "page" : undefined}>
      {user?.avatarUrl ? <span className={`tab-avatar ${profileActive ? "active" : ""}`}><Avatar name={user.displayName} src={user.avatarUrl} size={26} /></span> : <UserRound size={24} strokeWidth={profileActive ? 2.3 : 1.7} />}
    </Link>
  </nav>;
}

export function MobileTabBar({ user }: { user: TabUser }) {
  return <Suspense fallback={null}><Tabs user={user} /></Suspense>;
}
