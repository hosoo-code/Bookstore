import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Bonum Gateway (QPay etc.). Endpoints follow the public Bonum SDKs; confirm field names against
// the official Bonum docs / sandbox before going live.
const base = () => (process.env.BONUM_GATEWAY_BASE_URL || "").replace(/\/+$/, "");
const terminal = () => process.env.BONUM_TERMINAL_ID || "";

export function isBonumConfigured() {
  return Boolean(base() && process.env.BONUM_APP_SECRET && terminal() && process.env.BONUM_MERCHANT_CHECKSUM_KEY && process.env.NEXT_PUBLIC_CURRENCY === "MNT");
}

let cached: { token: string; expiresAt: number } | null = null;
async function accessToken() {
  if (cached && cached.expiresAt > Date.now() + 15_000) return cached.token;
  const response = await fetch(`${base()}/bonum-gateway/ecommerce/auth/create`, { headers: { Authorization: `AppSecret ${process.env.BONUM_APP_SECRET}`, "X-TERMINAL-ID": terminal() }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  const token: string | undefined = data.accessToken ?? data.access_token ?? data.token ?? data.data?.accessToken;
  if (!response.ok || !token) throw new Error("Payment provider sign-in failed.");
  const seconds = Number(data.expiresIn ?? data.expires_in ?? data.data?.expiresIn ?? 300);
  cached = { token, expiresAt: Date.now() + (Number.isFinite(seconds) ? seconds : 300) * 1000 };
  return token;
}

export async function createBonumInvoice(input: { amountMnt: number; transactionId: string; callback: string }) {
  const token = await accessToken();
  const response = await fetch(`${base()}/bonum-gateway/ecommerce/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-TERMINAL-ID": terminal(), "Accept-Language": "mn" },
    body: JSON.stringify({ amount: input.amountMnt, callback: input.callback, transactionId: input.transactionId, expiresIn: 1800, providers: ["QPAY"] }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  const url: string | undefined = data.followUpLink ?? data.data?.followUpLink;
  if (!response.ok || !url) throw new Error("Could not create the payment invoice.");
  return { url, invoiceId: String(data.invoiceId ?? data.data?.invoiceId ?? "") };
}

export function verifyBonumChecksum(rawBody: string, header: string | null) {
  const key = process.env.BONUM_MERCHANT_CHECKSUM_KEY;
  if (!key || !header) return false;
  const expected = createHmac("sha256", key).update(rawBody).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(header.trim().toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}
