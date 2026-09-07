/**
 * Minimal iCal (RFC 5545) parser for Airbnb calendar feeds.
 *
 * Airbnb exports one VEVENT per booking plus placeholder "Airbnb (Not
 * available)" blocks for owner-blocked dates. Only real guest reservations
 * — where the SUMMARY contains a name inside parentheses that isn't
 * "Not available" — become MNGO bookings.
 */

export interface ICalEvent {
  uid: string;
  summary: string;
  /** YYYY-MM-DD — check-in date */
  dtStart: string;
  /** YYYY-MM-DD — check-out date (iCal DTEND is exclusive, matches MNGO's convention) */
  dtEnd: string;
  status: "CONFIRMED" | "CANCELLED";
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
  let cur: { uid?: string; summary?: string; dtStart?: string; dtEnd?: string; status?: string } = {};

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      inEvent = false;
      if (cur.uid && cur.dtStart && cur.dtEnd) {
        events.push({
          uid: cur.uid,
          summary: cur.summary ?? "",
          dtStart: cur.dtStart,
          dtEnd: cur.dtEnd,
          status: cur.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED",
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
    else if (prop === "STATUS") cur.status = val.toUpperCase();
  }

  return events;
}

/**
 * Extracts the guest's name from an Airbnb iCal SUMMARY.
 * "Airbnb (John S.)"  → "John S."
 * "Airbnb (Not available)" → null  (owner-blocked date, not a real guest)
 * Any other format         → null
 */
export function extractGuestName(summary: string): string | null {
  const m = summary.match(/\(([^)]+)\)/);
  if (!m) return null;
  const name = m[1].trim();
  if (name.toLowerCase() === "not available") return null;
  return name || null;
}
