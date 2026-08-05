import type { WorkspaceType } from "./types";

/** context/05-ui-context.md "Navigation": "Menu order: Dashboard · Bookings
 * · Issues & Schedules · Team · Financials". Team is hidden from the
 * Property Owner nav — filtered by effectiveCanEdit where this is used. */
export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "bookings", label: "Bookings", href: "/bookings" },
  { key: "issues", label: "Issues & Schedules", href: "/issues" },
  { key: "team", label: "Team", href: "/team" },
  { key: "financials", label: "Financials", href: "/financials" },
] as const;

/** HOSTEL workspaces (e.g. Escape3Points) relabel "Bookings" to "Rooms" —
 * same underlying /bookings route, just a different label for a room-based
 * product — and gain a "Kitchen" tab for daily menu curation. */
export const NAV_ITEMS_HOSTEL = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "bookings", label: "Rooms", href: "/bookings" },
  { key: "kitchen", label: "Kitchen", href: "/kitchen" },
  { key: "issues", label: "Issues & Schedules", href: "/issues" },
  { key: "team", label: "Team", href: "/team" },
  { key: "financials", label: "Financials", href: "/financials" },
] as const;

export function getNavItems(workspaceType: WorkspaceType | undefined) {
  return workspaceType === "HOSTEL" ? NAV_ITEMS_HOSTEL : NAV_ITEMS;
}
