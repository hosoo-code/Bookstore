// Marketplace commission: 10% of every seller-listed book goes to the platform (admin) account.
export const PLATFORM_FEE_PERCENT = 10;
export function splitSale(lineTotalCents: number) {
  const feeCents = Math.round((lineTotalCents * PLATFORM_FEE_PERCENT) / 100);
  return { feeCents, sellerEarningsCents: lineTotalCents - feeCents };
}
