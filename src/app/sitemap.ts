import type { MetadataRoute } from "next";
import { getBooks } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const routes = ["", "/books", "/feed", "/about", "/contact", "/faq", "/privacy", "/terms"];
  const items = await getBooks();
  return [...routes.map((route) => ({ url: `${base}${route}`, lastModified: new Date(), changeFrequency: "weekly" as const })), ...items.map((book) => ({ url: `${base}/books/${book.id}`, lastModified: book.createdAt, changeFrequency: "monthly" as const }))];
}
