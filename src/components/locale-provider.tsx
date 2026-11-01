"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { translator, type Locale, type Translator } from "@/lib/i18n";

const Ctx = createContext<{ locale: Locale; t: Translator }>({ locale: "en", t: translator("en") });
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: translator(locale) }), [locale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useLocale() { return useContext(Ctx); }
