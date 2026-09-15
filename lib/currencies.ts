import type { Currency, PrevBalance, Property } from "./types";

/**
 * Curated currency list — driven by real signups, not a full ISO 4217
 * list. GHS and EUR were the original two (still the only pair with a
 * dedicated Property.prevBalance* column, see lib/types.ts); the rest
 * added 2026-09-15 after a real friend tried to sign up a shop based in
 * Nigeria and had no way to pick NGN. Adding another currency later is a
 * two-step, fully additive change: append it here (plus a country entry
 * below) and add the matching Postgres enum value via
 * `ALTER TYPE "Currency" ADD VALUE` — no existing data is touched either
 * way.
 */
/** `as const` tuple (not just `Currency[]`) so `z.enum()` schemas can be
 * built directly from it — zod requires a literal tuple, not a plain
 * array, for its enum validator. */
export const CURRENCY_ENUM_VALUES = ["GHS", "NGN", "EUR", "USD", "GBP", "ZAR", "KES"] as const;

export const CURRENCY_CODES: Currency[] = [...CURRENCY_ENUM_VALUES];

export const CURRENCY_LABEL: Record<Currency, string> = {
  GHS: "Ghanaian Cedi",
  NGN: "Nigerian Naira",
  EUR: "Euro",
  USD: "US Dollar",
  GBP: "British Pound",
  ZAR: "South African Rand",
  KES: "Kenyan Shilling",
};

/**
 * Country → default currency, for the signup location question ("their
 * property is in Nigeria" → NGN, not a manual currency guess). Not
 * exhaustive — deliberately scoped to countries real users are actually
 * signing up from plus a handful of likely-next ones, with an explicit
 * "Other" escape hatch rather than silently defaulting somewhere wrong.
 * Picking a country only *pre-selects* a currency on the signup form; the
 * currency picker underneath stays editable (e.g. a Ghana-based Airbnb
 * host still wants EUR added alongside GHS for Airbnb payouts, same as
 * the real Oak & Co. workspace).
 */
export const COUNTRY_CURRENCY: { country: string; currency: Currency }[] = [
  { country: "Ghana", currency: "GHS" },
  { country: "Nigeria", currency: "NGN" },
  { country: "Kenya", currency: "KES" },
  { country: "South Africa", currency: "ZAR" },
  { country: "United Kingdom", currency: "GBP" },
  { country: "United States", currency: "USD" },
  { country: "Spain", currency: "EUR" },
  { country: "France", currency: "EUR" },
  { country: "Germany", currency: "EUR" },
  { country: "Portugal", currency: "EUR" },
  { country: "Ireland", currency: "EUR" },
  { country: "Italy", currency: "EUR" },
  { country: "Netherlands", currency: "EUR" },
  { country: "Other", currency: "USD" },
];

/** GHS and EUR keep their own dedicated Property columns (untouched since
 * the original two-currency design, so the two original live workspaces
 * are unaffected); every other currency's running balance lives in the
 * generic prevBalancesOther map, missing entirely until a property first
 * has real activity in that currency — same "not there yet means zero"
 * convention prevBalanceGhs/prevBalanceEur already have at property
 * creation. Pure/no server imports — safe to call from client components
 * (e.g. the Financials screen) as well as API routes/lib/reports.ts. */
export function getPrevBalance(
  property: Pick<Property, "prevBalanceGhs" | "prevBalanceEur" | "prevBalancesOther">,
  currency: Currency
): PrevBalance {
  if (currency === "GHS") return property.prevBalanceGhs;
  if (currency === "EUR") return property.prevBalanceEur;
  return property.prevBalancesOther[currency] ?? { owners: 0, management: 0 };
}
