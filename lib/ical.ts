/**
 * Minimal iCal (RFC 5545) parser for Airbnb calendar feeds.
 *
 * Airbnb exports one VEVENT per booking plus placeholder "Airbnb (Not
 * available)" blocks for owner-blocked dates. A real reservation's
 * SUMMARY is literally just "Reserved" — Airbnb does not include the
 * guest's name anywhere in the feed, for privacy reasons. This was
 * wrong in the original implementation (assumed a "Airbnb (Guest Name)"
 * SUMMARY format that doesn't actually exist), which meant every real
 * reservation was silently skipped as if it were a blocked-date
 * placeholder — the sync ran without errors and simply never created a
 * single booking. Fixed 2026-09-09 against a real Airbnb export feed.
 *
 * A blocked/unavailable placeholder always has a SUMMARY of the form
 * "Airbnb (...)"; anything else is a real reservation. Since there's no
 * guest name available, `extractReservationCode` pulls the reservation
 * code out of the DESCRIPTION field's "Reservation URL" instead, used
 * as a traceable placeholder guest label (e.g. "Airbnb guest (HM3ANFZ28H)")
 * so the manager can look the booking up in their own Airbnb host
 * dashboard once they need the guest's real name.
 *
 * There is no STATUS field for cancellations in Airbnb's real feed
 * either — a cancelled reservation just disappears from the feed
 * entirely. The cron job already detects this correctly by noticing a
 * previously-synced UID is no longer present, independent of anything
 * parsed here.
 */

export interface ICalEvent {
  uid: string;
  summary: string;
  /** YYYY-MM-DD — check-in date */
  dtStart: string;
  /** YYYY-MM-DD — check-out date (iCal DTEND is exclusive, matches MNGO's convention) */
  dtEnd: string;
  /** Raw DESCRIPTION text, if present — real reservations carry a
   * "Reservation URL: .../details/<CODE>" line here; blocked-date
   * placeholders have none. */
  description: string | null;
  /** false for an "Airbnb (...)" owner-blocked placeholder, true for
   * anything else (in practice, always literally "Reserved"). */
  isReservation: boolean;
}

function parseICalDate(value: string): string {
  const m = value.match(/(\d{4})(\d{2})(\d{2})/);
  if (!m) throw new Error(`Unparseable iCal date: ${value}`);
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function parseICalFeed(icsText: string): ICalEvent[] {
  // Normalise line endings, then unfold continuation lines (RFC 5545 §3.1)
  const raw = icsText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines: string[] = [];
  for (const line of raw.split("\n")) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }

  const events: ICalEvent[] = [];
  let inEvent = false;
  let cur: { uid?: string; summary?: string; dtStart?: string; dtEnd?: string; description?: string } = {};

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      inEvent = false;
      if (cur.uid && cur.dtStart && cur.dtEnd) {
        const summary = cur.summary ?? "";
        events.push({
          uid: cur.uid,
          summary,
          dtStart: cur.dtStart,
          dtEnd: cur.dtEnd,
          description: cur.description ?? null,
          isReservation: !/^Airbnb \(/i.test(summary.trim()),
        });
      }
      cur = {};
      continue;
    }
    if (!inEvent) continue;

    const colon = line.indexOf(":");
    if (colon === -1) continue;

    // Property name may include parameters, e.g. "DTSTART;VALUE=DATE"
    const prop = line.slice(0, colon).split(";")[0].toUpperCase();
    const val = line.slice(colon + 1).trim();

    if (prop === "UID") cur.uid = val;
    else if (prop === "DTSTART") cur.dtStart = parseICalDate(val);
    else if (prop === "DTEND") cur.dtEnd = parseICalDate(val);
    else if (prop === "SUMMARY") cur.summary = val;
    else if (prop === "DESCRIPTION") cur.description = val;
  }

  return events;
}

/**
 * Pulls the reservation code out of a real reservation's DESCRIPTION,
 * e.g. "Reservation URL: https://www.airbnb.com/hosting/reservations/
 * details/HM3ANFZ28H\nPhone Number (Last 4 Digits): 1675" → "HM3ANFZ28H".
 * Returns null if the description is missing or doesn't match (should
 * only happen if Airbnb changes this format).
 */
export function extractReservationCode(description: string | null): string | null {
  if (!description) return null;
  const m = description.match(/reservations\/details\/([A-Za-z0-9]+)/i);
  return m ? m[1] : null;
}
