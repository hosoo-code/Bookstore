import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getT } from "@/lib/locale";
export async function Hero() {
  const { t } = await getT();
  return <section className="hero-banner" aria-label="Welcome to BookBuch"><div className="site-container hero-inner">
    <p className="hero-eyebrow">{t("hero.eyebrow")}</p>
    <h1 className="hero-title">BookBuch <span>✦</span></h1>
    <p className="hero-subtitle">{t("hero.subtitle")}</p>
    <p className="hero-description">{t("hero.desc")}</p>
    <Link className="hero-button" href="/books">{t("hero.button")} <ArrowRight size={16} strokeWidth={1.8} /></Link>
  </div></section>;
}
