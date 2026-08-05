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

/** HOSTEL workspaces (e.g. Escape3Points) relabel "Bookings" to "Guest" —
 * same underlying /bookings route, just a different label for a room-based
 * product. "Menu" (/menu) is daily menu curation (formerly the "Kitchen"
 * label on this same route, when order fulfillment didn't exist yet).
 * "Kitchen" (/kitchen) and "Bar" (/bar) are order-fulfillment screens —
 * Kitchen for food, Bar for drinks, split by MenuItem.station. Team and
 * Financials become owner-only visibility for HOSTEL (Architecture
 * Decision — see app-shell.tsx / tabs-sidebar.tsx / top-bar.tsx), not
 * filtered here since this array doesn't know the viewer's role. */
export const NAV_ITEMS_HOSTEL = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "bookings", label: "Guest", href: "/bookings" },
  { key: "menu", label: "Menu", href: "/menu" },
  { key: "kitchen", label: "Kitchen", href: "/kitchen" },
  { key: "bar", label: "Bar", href: "/bar" },
  { key: "issues", label: "Issues & Schedules", href: "/issues" },
  { key: "team", label: "Team", href: "/team" },
  { key: "financials", label: "Financials", href: "/financials" },
] as const;

export function getNavItems(workspaceType: WorkspaceType | undefined) {
  return workspaceType === "HOSTEL" ? NAV_ITEMS_HOSTEL : NAV_ITEMS;
}
