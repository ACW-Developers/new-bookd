export const CURRENCY_SYMBOL = "Ksh";

export function formatPrice(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return `${CURRENCY_SYMBOL} —`;
  const n = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(n)) return `${CURRENCY_SYMBOL} —`;
  return `${CURRENCY_SYMBOL} ${n.toLocaleString()}`;
}
