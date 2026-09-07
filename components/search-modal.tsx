"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, X } from "lucide-react";
import { C } from "@/lib/colors";
import { Pill, type PillTone } from "@/components/primitives";
import { useAppStore } from "@/store/use-app-store";
import { useBookings } from "@/lib/queries/bookings";
import { useIssues } from "@/lib/queries/issues";
import { useSchedules } from "@/lib/queries/schedules";
import { useTeam } from "@/lib/queries/team";
import { useProperties } from "@/lib/queries/properties";

/**
 * context/07-mockup.jsx SearchModal, extended from its original two
 * categories (bookings, team) to every entity worth jumping straight to —
 * properties, bookings, issues, schedules, team. Deliberately client-side:
 * it filters data the existing `use*` hooks already fetch and cache
 * elsewhere in the app (same data TopBar/PropertySwitcher/Bookings/etc.
 * already pull), so it inherits their existing role/property scoping for
 * free (GET /api/team already 403s a PROPERTY_OWNER, GET /api/bookings
 * already scopes to assigned properties, etc.) rather than duplicating
 * that logic in a new server route. This is the last piece of the app
 * shell the mockup's own TopBar had that was missing here — see
 * components/top-bar.tsx's doc comment ("still has nothing real to search
 * over").
 */

const MAX_PER_GROUP = 5;

interface ResultRow {
  id: string;
  title: string;
  subtitle?: string;
  onSelect: () => void;
}

interface ResultGroup {
  label: string;
  tone: PillTone;
  rows: ResultRow[];
}

export function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const setActivePropertyId = useAppStore((s) => s.setActivePropertyId);

  const propertiesQuery = useProperties();
  const bookingsQuery = useBookings();
  const issuesQuery = useIssues();
  const schedulesQuery = useSchedules();
  const teamQuery = useTeam();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const go = useCallback(
    (path: string) => {
      router.push(path);
      onClose();
    },
    [router, onClose]
  );

  const q = query.trim().toLowerCase();

  const groups: ResultGroup[] = useMemo(() => {
    if (!q) return [];

    const propertyRows: ResultRow[] = (propertiesQuery.data ?? [])
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP)
      .map((p) => ({
        id: p.id,
        title: p.name,
        onSelect: () => {
          setActivePropertyId(p.id);
          go("/dashboard");
        },
      }));

    const bookingRows: ResultRow[] = (bookingsQuery.data ?? [])
      .filter(
        (b) =>
          b.guest.toLowerCase().includes(q) ||
          (b.bookingCode ?? "").toLowerCase().includes(q)
      )
      .slice(0, MAX_PER_GROUP)
      .map((b) => ({
        id: b.id,
        title: b.guest,
        subtitle: `${b.checkIn} → ${b.checkOut}`,
        onSelect: () => go(`/bookings?bookingId=${b.id}`),
      }));

    const issueRows: ResultRow[] = (issuesQuery.data ?? [])
      .filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          (i.guest ?? "").toLowerCase().includes(q)
      )
      .slice(0, MAX_PER_GROUP)
      .map((i) => ({
        id: i.id,
        title: i.description,
        subtitle: i.guest ? `Guest: ${i.guest} · ${i.date}` : i.date,
        onSelect: () => go(`/issues?issueId=${i.id}`),
      }));

    const scheduleRows: ResultRow[] = (schedulesQuery.data ?? [])
      .filter(
        (s) =>
          s.assignedTo.toLowerCase().includes(q) ||
          (s.note ?? "").toLowerCase().includes(q)
      )
      .slice(0, MAX_PER_GROUP)
      .map((s) => ({
        id: s.id,
        title: s.assignedTo,
        subtitle: s.note ? `${s.note} · ${s.date}` : s.date,
        onSelect: () => go(`/issues?tab=schedules&scheduleId=${s.id}`),
      }));

    // useTeam() 403s for a PROPERTY_OWNER (GET /api/team is manager-only) —
    // isError just means "no team results," not a broken search.
    const teamRows: ResultRow[] = teamQuery.isError
      ? []
      : (teamQuery.data ?? [])
          .filter((t) => t.name.toLowerCase().includes(q))
          .slice(0, MAX_PER_GROUP)
          .map((t) => ({
            id: t.id,
            title: t.name,
            subtitle: t.role,
            onSelect: () => go(`/team?memberId=${t.id}`),
          }));

    return [
      { label: "Properties", tone: "accent" as PillTone, rows: propertyRows },
      { label: "Bookings", tone: "teal" as PillTone, rows: bookingRows },
      { label: "Issues", tone: "amber" as PillTone, rows: issueRows },
      { label: "Schedules", tone: "muted" as PillTone, rows: scheduleRows },
      { label: "Team", tone: "light" as PillTone, rows: teamRows },
    ].filter((g) => g.rows.length > 0);
  }, [
    q,
    propertiesQuery.data,
    bookingsQuery.data,
    issuesQuery.data,
    schedulesQuery.data,
    teamQuery.data,
    teamQuery.isError,
    setActivePropertyId,
    go,
  ]);

  const hasAnyResults = groups.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 20px 48px rgba(0,0,0,0.22)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <SearchIcon size={16} style={{ color: C.muted }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookings, issues, team, properties…"
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: C.text }}
          />
          <button onClick={onClose}>
            <X size={18} style={{ color: C.muted }} />
          </button>
        </div>
        <div className="p-2 max-h-96 overflow-y-auto">
          {q === "" && (
            <p className="text-sm px-3 py-4" style={{ color: C.muted }}>
              Start typing to search.
            </p>
          )}
          {q !== "" && !hasAnyResults && (
            <p className="text-sm px-3 py-4" style={{ color: C.muted }}>
              No matches.
            </p>
          )}
          {groups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="text-xs font-semibold uppercase tracking-wide px-3 pt-2 pb-1" style={{ color: C.muted }}>
                {group.label}
              </p>
              {group.rows.map((row) => (
                <button
                  key={row.id}
                  onClick={row.onSelect}
                  className="w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                  style={{ color: C.text }}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium truncate">{row.title}</span>
                    {row.subtitle && (
                      <span className="block text-xs truncate" style={{ color: C.muted }}>
                        {row.subtitle}
                      </span>
                    )}
                  </span>
                  <Pill tone={group.tone}>{group.label.replace(/s$/, "")}</Pill>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
