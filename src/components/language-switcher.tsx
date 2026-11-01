"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { LOCALE_COOKIE, localeLabels, locales, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  function change(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }
  return <label className={`lang-switch ${className}`}>
    <Globe size={15} strokeWidth={1.8} aria-hidden="true" />
    <select value={locale} onChange={(event) => change(event.target.value as Locale)} aria-label={t("nav.language")}>
      {locales.map((code) => <option key={code} value={code}>{localeLabels[code]}</option>)}
    </select>
  </label>;
}
