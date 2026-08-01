/**
 * Best-effort parsing for arbitrary CSV exports (Architecture Decision
 * 44) — we don't know the source format in advance, so this tries a
 * handful of common shapes rather than assuming one.
 */

/** Accepts "YYYY-MM-DD", "MM/DD/YYYY", or "DD/MM/YYYY" (ambiguous
 * day/month values are treated as MM/DD, the more common export format).
 * Returns an ISO "YYYY-MM-DD" string, or null if unparseable. */
export function parseFlexibleDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    return toISODate(Number(y), Number(m), Number(d));
  }

  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, a, b, y] = slash;
    return toISODate(Number(y), Number(a), Number(b));
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function toISODate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Strips currency symbols/commas/whitespace, e.g. "€1,234.50" -> 1234.5. */
export function parseFlexibleAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}
