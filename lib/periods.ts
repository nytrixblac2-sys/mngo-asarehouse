/**
 * Dynamic Week/Month/Year comparison ranges for the Dashboard chart.
 * context/07-mockup.jsx hardcodes `TODAY = new Date('2026-07-07T00:00:00')`
 * and the PERIODS object's date ranges/prefixes. context/06-progress-tracker.md
 * Session Notes: "month navigation must be fully dynamic — any year and
 * month must be selectable." This computes everything from the real
 * current date instead, and uses actual days-in-month/leap-year day
 * counts rather than the mockup's hardcoded 31/365.
 */

export type PeriodKey = "Week" | "Month" | "Year";

export interface PeriodRange {
  label: string;
  start: string;
  end: string;
  days: number;
}

export interface PeriodPair {
  current: PeriodRange;
  previous: PeriodRange;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getPeriodPair(periodKey: PeriodKey, today: Date = new Date()): PeriodPair {
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  const d = today.getUTCDate();

  if (periodKey === "Week") {
    const currentEnd = new Date(Date.UTC(y, m, d));
    const currentStart = new Date(Date.UTC(y, m, d - 6));
    const previousEnd = new Date(Date.UTC(y, m, d - 7));
    const previousStart = new Date(Date.UTC(y, m, d - 13));
    return {
      current: { label: "This week", start: toISODate(currentStart), end: toISODate(currentEnd), days: 7 },
      previous: { label: "Last week", start: toISODate(previousStart), end: toISODate(previousEnd), days: 7 },
    };
  }

  if (periodKey === "Month") {
    const currentStart = new Date(Date.UTC(y, m, 1));
    const currentEnd = new Date(Date.UTC(y, m, daysInMonth(y, m)));
    const prevMonthDate = new Date(Date.UTC(y, m - 1, 1));
    const py = prevMonthDate.getUTCFullYear();
    const pm = prevMonthDate.getUTCMonth();
    const previousStart = new Date(Date.UTC(py, pm, 1));
    const previousEnd = new Date(Date.UTC(py, pm, daysInMonth(py, pm)));
    return {
      current: { label: MONTH_NAMES[m], start: toISODate(currentStart), end: toISODate(currentEnd), days: daysInMonth(y, m) },
      previous: { label: MONTH_NAMES[pm], start: toISODate(previousStart), end: toISODate(previousEnd), days: daysInMonth(py, pm) },
    };
  }

  const currentDays = isLeapYear(y) ? 366 : 365;
  const previousDays = isLeapYear(y - 1) ? 366 : 365;
  return {
    current: { label: String(y), start: `${y}-01-01`, end: `${y}-12-31`, days: currentDays },
    previous: { label: String(y - 1), start: `${y - 1}-01-01`, end: `${y - 1}-12-31`, days: previousDays },
  };
}

export function inRange(dateStr: string, range: PeriodRange): boolean {
  return dateStr >= range.start && dateStr <= range.end;
}

/** Whole nights between two ISO dates — real date diffing, not the
 * mockup's day-of-month subtraction (which silently breaks across month
 * boundaries, e.g. Jan 30 -> Feb 2). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T00:00:00Z`).getTime();
  const end = new Date(`${checkOut}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}
