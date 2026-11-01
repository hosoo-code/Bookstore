import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";
import { getT } from "@/lib/locale";
export async function PromoBanner() {
  const { t } = await getT();
  return <aside className="promo-card" aria-label="Join BookBuch"><div className="promo-content">
    <Send className="promo-plane" size={29} strokeWidth={1.4} />
    <h3 className="promo-title">{t("promo.line1")}<br /><em>{t("promo.line2")}</em></h3>
    <p className="promo-copy">{t("promo.copy")}</p>
    <Link className="promo-button" href="/register">{t("promo.button")} <ArrowRight size={14} /></Link>
  </div></aside>;
}
