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
