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
 * "Orders" (/orders) is order fulfillment for all four MenuItem.station
 * values — Kitchen for food, Bar for drinks, Shop for gift-shop purchases,
 * Experiences for bookable guest experiences — as one page with its own
 * Kitchen/Bar/Shop/Experiences tab switcher (components/order-fulfillment-
 * screen.tsx via app/(app)/orders/page.tsx), rather than four separate nav
 * items each pointing at the same underlying screen. Team and Financials
 * become owner-only visibility for HOSTEL (Architecture Decision — see
 * app-shell.tsx / tabs-sidebar.tsx / top-bar.tsx), not filtered here since
 * this array doesn't know the viewer's role. */
export const NAV_ITEMS_HOSTEL = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "bookings", label: "Guest", href: "/bookings" },
  { key: "menu", label: "Menu", href: "/menu" },
  { key: "orders", label: "Orders", href: "/orders" },
  { key: "issues", label: "Issues & Schedules", href: "/issues" },
  { key: "team", label: "Team", href: "/team" },
  { key: "financials", label: "Financials", href: "/financials" },
] as const;

export const NAV_ITEMS_RENTAL_SHOP = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "bookings", label: "Bookings", href: "/bookings" },
  { key: "shop", label: "Shop", href: "/shop" },
  { key: "issues", label: "Issues & Schedules", href: "/issues" },
  { key: "team", label: "Team", href: "/team" },
  { key: "financials", label: "Financials", href: "/financials" },
] as const;

export function getNavItems(workspaceType: WorkspaceType | undefined, hasShop?: boolean) {
  if (workspaceType === "HOSTEL") return NAV_ITEMS_HOSTEL;
  // Show Shop nav for all RENTAL workspaces — hasShop controls the guest-facing
  // feature, not admin visibility. Owner navigates to /shop to enable it.
  if (workspaceType === "RENTAL") return NAV_ITEMS_RENTAL_SHOP;
  if (hasShop) return NAV_ITEMS_RENTAL_SHOP;
  return NAV_ITEMS;
}
