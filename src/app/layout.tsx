import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser, publicUser } from "@/lib/auth";
import { getCategories } from "@/lib/catalog";
import { and, eq, isNull, sql } from "drizzle-orm";
import { CartProvider } from "@/components/cart-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { getLocale } from "@/lib/locale";
import { categoryName, translator } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "BookBuch | Two languages. One world of books.", template: "%s | BookBuch" },
  description: "Discover your next favorite read. Shop English and German books, share reviews, and connect with readers who love what you love.",
  applicationName: "BookBuch",
  keywords: ["BookBuch", "books", "bookstore", "English books", "German books", "reading community"],
  openGraph: { type: "website", siteName: "BookBuch", title: "BookBuch — Two languages. One world of books.", description: "A premium bookstore and a place for readers to connect.", images: ["/images/library-hero.jpg"] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F8F5EF" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [currentUser, categories, locale] = await Promise.all([getCurrentUser(), getCategories(), getLocale()]);
  const t = translator(locale);
  const user = publicUser(currentUser);
  const [unread] = currentUser ? await db.select({ count: sql<number>`count(*)::int` }).from(notifications)
    .where(and(eq(notifications.recipientId, currentUser.id), isNull(notifications.readAt))) : [{ count: 0 }];
  return (
    <html lang={locale}>
      <body>
        <LocaleProvider locale={locale}><CartProvider userId={user?.id ?? null}>
          <SiteHeader user={user} categories={categories.map(({ slug, name }) => ({ slug, name: categoryName(t, slug, name) }))} unreadNotifications={unread.count} />
          <main id="main-content">{children}</main>
          <SiteFooter />
          <MobileTabBar user={user ? { displayName: user.displayName, avatarUrl: user.avatarUrl } : null} />
        </CartProvider></LocaleProvider>
      </body>
    </html>
  );
}
