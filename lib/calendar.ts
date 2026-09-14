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

/** Whether `day` (in the currently-viewed month/year) is the real current
 * date — user feedback, 2026-08: none of Day/Week/Month view actually
 * marked today, only the user's *selected* day, which defaults to day 1
 * rather than today. */
export function isToday(activeMonth: { year: number; month: number }, day: number): boolean {
  const now = new Date();
  return now.getFullYear() === activeMonth.year && now.getMonth() === activeMonth.month && now.getDate() === day;
}

/** Full ISO "YYYY-MM-DD" for `day` within the given month/year — the
 * counterpart to dayOfMonth, for building a real date to compare against
 * a booking/schedule/issue's own ISO date fields. */
export function isoDateForDay(activeMonth: { year: number; month: number }, day: number): string {
  return `${activeMonth.year}-${pad2(activeMonth.month + 1)}-${pad2(day)}`;
}

/**
 * Whether a booking visually touches `day` in the month grid currently
 * being viewed — context/07-mockup.jsx bookingCoversDay. Compares full
 * dates, not bare day-of-month numbers: the original mockup-derived
 * version compared `dayOfMonth(checkIn)`/`dayOfMonth(checkOut)` directly
 * against `day`, which silently breaks for any booking spanning a month
 * boundary — e.g. checkIn "2026-06-19" -> checkOut "2026-07-03" produced
 * `day >= 19 && day < 3`, true for no day at all, so the booking never
 * rendered on any calendar cell except via callers' separate
 * `dayOfMonth(checkIn) === day` fallback (which only catches the single
 * check-in day, and itself risks false positives — see Architecture
 * Decision 60). Same class of bug as Architecture Decision 22's
 * `nightsBetween` fix, just never applied here too.
 */
export function bookingCoversDay(b: { checkIn: string; checkOut: string }, activeMonth: { year: number; month: number }, day: number): boolean {
  const iso = isoDateForDay(activeMonth, day);
  return iso >= b.checkIn && iso < b.checkOut;
}

/** Whether `day` is exactly this booking's check-in date — user request
 * 2026-08-04: check-in/check-out days get distinct dot colors across the
 * Day/Week/Month views, since checkout days previously had no calendar
 * indicator at all (`bookingCoversDay` deliberately excludes the checkout
 * day itself — the guest isn't occupying that night). */
export function bookingChecksInOn(b: { checkIn: string }, activeMonth: { year: number; month: number }, day: number): boolean {
  return isoDateForDay(activeMonth, day) === b.checkIn;
}

/** Whether `day` is exactly this booking's check-out date. */
export function bookingChecksOutOn(b: { checkOut: string }, activeMonth: { year: number; month: number }, day: number): boolean {
  return isoDateForDay(activeMonth, day) === b.checkOut;
}

/**
 * Whether an issue applies to `day` — user report, 2026-09: a guest
 * cancellation logged as an issue only showed on the single day it was
 * logged, not across the guest's actual stay, so clicking any other day
 * of that booking showed nothing. An issue linked to a booking
 * (`bookingId`) now applies to every day of that booking's stay,
 * check-in through check-out *inclusive* (unlike `bookingCoversDay`,
 * which deliberately excludes checkout since that's not an occupied
 * night — an issue about the booking is still relevant on the day the
 * guest actually leaves). An issue with no linked booking (staff/
 * maintenance notes, or an older issue from before this existed) falls
 * back to the original single-day match on its own `date` field.
 */
export function issueAppliesOnDay(
  i: { date: string; bookingId?: string | null },
  bookings: { id: string; checkIn: string; checkOut: string }[],
  activeMonth: { year: number; month: number },
  day: number
): boolean {
  if (i.bookingId) {
    const booking = bookings.find((b) => b.id === i.bookingId);
    if (booking) {
      const iso = isoDateForDay(activeMonth, day);
      return iso >= booking.checkIn && iso <= booking.checkOut;
    }
  }
  return dayOfMonth(i.date) === day;
}
