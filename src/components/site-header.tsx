"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Search, ShoppingBag, UserRound, X, MessageCircle, Bell } from "lucide-react";
import { Brand } from "@/components/brand";
import { Avatar } from "@/components/avatar";
import { useCart } from "@/components/cart-provider";
import { useLocale } from "@/components/locale-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type HeaderUser = { id: string; username: string; displayName: string; avatarUrl: string | null; role: string } | null;
type CategoryLink = { slug: string; name: string };
function SearchForm() {
  const { t } = useLocale();
  return <form action="/books" className="header-search" role="search">
    <Search size={15} strokeWidth={1.8} /><input name="q" placeholder={t("search.placeholder")} aria-label={t("search.placeholder")} /><button type="submit" className="sr-only">Search</button>
  </form>;
}
function Navigation({ categories, onNavigate }: { categories: CategoryLink[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useLocale();
  return <>
    <Link href="/" onClick={onNavigate} className="nav-link" style={pathname === "/" ? { color: "#a17b38" } : undefined}>{t("nav.home")}</Link>
    <details className="nav-dropdown"><summary className="nav-link">{t("nav.books")} <ChevronDown size={13} /></summary><div className="dropdown-panel">
      <Link href="/books" onClick={onNavigate}>{t("nav.allBooks")}</Link><Link href="/books?featured=1" onClick={onNavigate}>{t("nav.featured")}</Link><Link href="/books?language=English" onClick={onNavigate}>{t("nav.english")}</Link><Link href="/books?language=German" onClick={onNavigate}>{t("nav.german")}</Link><Link href="/books?language=Mongolian" onClick={onNavigate}>{t("nav.mongolian")}</Link>
    </div></details>
    <details className="nav-dropdown"><summary className="nav-link">{t("nav.categories")} <ChevronDown size={13} /></summary><div className="dropdown-panel">
      {categories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} onClick={onNavigate}>{category.name}</Link>)}
    </div></details>
    <Link href="/feed" onClick={onNavigate} className="nav-link" style={pathname === "/feed" ? { color: "#a17b38" } : undefined}>{t("nav.feed")}</Link>
    <Link href="/sell" onClick={onNavigate} className="nav-link" style={pathname === "/sell" ? { color: "#a17b38" } : undefined}>{t("nav.sell")}</Link>
    <Link href="/about" onClick={onNavigate} className="nav-link">{t("nav.about")}</Link>
    <Link href="/contact" onClick={onNavigate} className="nav-link">{t("nav.contact")}</Link>
  </>;
}
export function SiteHeader({ user, categories, unreadNotifications = 0 }: { user: HeaderUser; categories: CategoryLink[]; unreadNotifications?: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLocale();
  const { count } = useCart();
  const userId = user?.id;
  const [unread, setUnread] = useState(unreadNotifications);
  useEffect(() => { const timer = window.setTimeout(() => setUnread(unreadNotifications), 0); return () => window.clearTimeout(timer); }, [unreadNotifications]);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function refresh() {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (response.ok && active) {
          const data = await response.json();
          setUnread(data.notifications.filter((item: { readAt: string | null }) => !item.readAt).length);
        }
      } catch { /* Retry on the next poll. */ }
    }
    const client = getSupabaseBrowserClient();
    const channel = client?.channel(`bookbuch-notifications-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` }, refresh)
      .subscribe();
    const timer = window.setInterval(refresh, 15000);
    return () => { active = false; window.clearInterval(timer); if (channel && client) void client.removeChannel(channel); };
  }, [userId]);
  return <header className="site-header">
    <div className="site-container header-inner">
      <Brand />
      <nav aria-label="Main navigation" className="desktop-nav"><Navigation categories={categories} /></nav>
      <div className="header-actions">
        <SearchForm />
        <LanguageSwitcher className="lang-desktop" />
        {user && <Link href="/messages" className="icon-link optional-icon" aria-label={t("nav.messages")}><MessageCircle size={20} strokeWidth={1.7} /></Link>}
        {user && <Link href="/notifications" className="icon-link optional-icon" aria-label={`${unread} unread notifications`}><Bell size={19} strokeWidth={1.7} />{unread > 0 && <span className="cart-badge">{unread > 9 ? "9+" : unread}</span>}</Link>}
        <Link href="/cart" className="icon-link" aria-label={`Shopping cart with ${count} books`}><ShoppingBag size={21} strokeWidth={1.8} />{count > 0 && <span className="cart-badge">{count > 9 ? "9+" : count}</span>}</Link>
        <Link href={user ? "/profile" : "/login"} className="icon-link" aria-label={user ? t("nav.profile") : t("nav.login")}>{user?.avatarUrl ? <Avatar name={user.displayName} src={user.avatarUrl} size={30} /> : <UserRound size={21} strokeWidth={1.8} />}</Link>
        <button type="button" className="mobile-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</button>
      </div>
    </div>
    <div className="mobile-search"><SearchForm /></div>
    <nav aria-label="Mobile navigation" className={`mobile-menu ${menuOpen ? "open" : ""}`}>
      <div className="flex flex-col"><Navigation categories={categories} onNavigate={() => setMenuOpen(false)} />
        {user && <><Link href="/messages" className="nav-link" onClick={() => setMenuOpen(false)}>{t("nav.messages")}</Link><Link href="/notifications" className="nav-link" onClick={() => setMenuOpen(false)}>{t("nav.notifications")} {unread > 0 ? `(${unread})` : ""}</Link></>}
        <Link href={user ? "/settings" : "/register"} className="nav-link" onClick={() => setMenuOpen(false)}>{user ? t("nav.settings") : t("nav.createAccount")}</Link>
        <LanguageSwitcher className="lang-mobile" />
      </div>
    </nav>
  </header>;
}
