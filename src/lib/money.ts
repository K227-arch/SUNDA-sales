// Money helpers. Money is stored as integer minor units (BigInt in the DB, number in JS).
// For UGX there is no minor unit, so 1 = 1 UGX. The amounts in this domain are well within
// Number.MAX_SAFE_INTEGER, so using `number` inside the calc engine is safe; BigInt is used
// only at the database boundary for exactness and to match the design spec (integer money).

export const toInt = (b: bigint | null | undefined): number =>
  b == null ? 0 : Number(b);

export const toBigInt = (n: number): bigint => BigInt(Math.round(n || 0));

export const round = (n: number): number => Math.round(n);

export function formatMoney(n: number, currency = "UGX"): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  return `${sign}${abs.toLocaleString("en-US")} ${currency}`;
}
