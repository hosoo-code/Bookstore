import Link from "next/link";
import { FaFacebookF, FaInstagram, FaYoutube, FaTelegramPlane } from "react-icons/fa";
import { getT } from "@/lib/locale";
import { Brand } from "@/components/brand";
export async function SiteFooter() {
  const { t } = await getT();
  return <footer className="site-footer">
    <div className="site-container footer-main">
      <div className="footer-brand"><Brand light /><p className="footer-tagline">{t("footer.tag1")}<br />{t("footer.tag2")}</p></div>
      <div><h2 className="footer-heading">{t("footer.quick")}</h2><div className="footer-links"><Link href="/about">{t("nav.about")}</Link><Link href="/contact">{t("nav.contact")}</Link><Link href="/privacy">{t("footer.privacy")}</Link><Link href="/terms">{t("footer.terms")}</Link><Link href="/faq">{t("footer.faq")}</Link><Link href="/feed">{t("footer.feed")}</Link></div></div>
      <div><h2 className="footer-heading">{t("footer.follow")}</h2><div className="footer-social">
        <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebookF size={15} /></a>
        <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram size={16} /></a>
        <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><FaYoutube size={17} /></a>
        <a href="https://telegram.org/" target="_blank" rel="noopener noreferrer" aria-label="Telegram"><FaTelegramPlane size={16} /></a>
      </div><p className="mt-5 text-xs leading-6 text-[#aab4c2]">{t("footer.social1")}<br />{t("footer.social2")}</p></div>
    </div>
    <div className="footer-bottom"><div className="site-container">{t("footer.rights")}</div></div>
  </footer>;
}
