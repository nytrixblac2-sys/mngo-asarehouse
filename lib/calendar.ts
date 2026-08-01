import { MONTH_NAMES, daysInMonth } from "./periods";

export { MONTH_NAMES, daysInMonth };

export interface ActiveMonth {
  year: number;
  month: number; // 0-indexed
  daysInMonth: number;
  monthPrefix: string; // "YYYY-MM"
  monthLabel: string; // "July 2026"
  monthShort: string; // "Jul"
}

/** context/07-mockup.jsx WEEKDAY_NAMES. */
export const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Day-of-month from an ISO "YYYY-MM-DD" string — string slicing avoids
 * any timezone ambiguity from parsing through `Date`. */
export function dayOfMonth(dateStr: string): number {
  return Number(dateStr.slice(8, 10));
}

/**
 * Whether a booking visually touches `day` in the month grid currently
 * being viewed — context/07-mockup.jsx bookingCoversDay. Scoped to a
 * single month by design (the calendar views are one-month grids); a
 * booking spanning a month boundary is handled by the caller only
 * including it in the relevant month's booking list to begin with.
 */
export function bookingCoversDay(b: { checkIn: string; checkOut: string }, day: number): boolean {
  const s = dayOfMonth(b.checkIn);
  const e = dayOfMonth(b.checkOut);
  return day >= s && day < e;
}
