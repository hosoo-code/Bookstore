import { cookies } from "next/headers";
import { LOCALE_COOKIE, toLocale, translator } from "@/lib/i18n";

export async function getLocale() {
  return toLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}
export async function getT() {
  const locale = await getLocale();
  return { locale, t: translator(locale) };
}
