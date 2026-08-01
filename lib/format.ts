import type { Currency } from "./types";

/** context/07-mockup.jsx fmtGHS/fmtEUR/fmtCurrency. */
export function fmtGHS(n: number): string {
  return `GH₵${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtEUR(n: number): string {
  return `€${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtCurrency(amount: number, currency: Currency): string {
  return currency === "EUR" ? fmtEUR(amount) : fmtGHS(amount);
}
