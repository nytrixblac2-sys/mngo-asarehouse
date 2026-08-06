import type { BookingSource, ExpenseCategory, IssueStatus, IssueType, MenuStation, PaymentMethod, ScheduleType } from "./types";

export const BOOKING_SOURCE_LABEL: Record<BookingSource, string> = {
  AIRBNB: "Airbnb",
  LOCAL: "Local / Cash",
  WEBSITE: "Website booking",
};

/** Display labels for enum values — context/07-mockup.jsx ISSUE_TYPES / SHIFT_TYPES. */
export const ISSUE_TYPE_LABEL: Record<IssueType, string> = {
  GUEST_COMPLAINT: "Guest Complaint",
  MAINTENANCE: "Maintenance",
  NOTE: "Note",
  ROOM_DIRTY: "Room Needs Cleaning",
};

export const SCHEDULE_TYPE_LABEL: Record<ScheduleType, string> = {
  CLEANING: "Cleaning",
  REPAIR: "Repair",
  SUPERVISION: "Supervision",
  TRAINING: "Training",
};

export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

/** context/05-ui-context.md "Issue Status Colors". */
export const ISSUE_STATUS_TONE: Record<IssueStatus, "accent" | "amber" | "teal"> = {
  OPEN: "accent",
  IN_PROGRESS: "amber",
  RESOLVED: "teal",
};

/** Generic label — "MANAGEMENT" reads as "Management" here, never "Oak &
 * Co." (Architecture Decision 7). Screens that want the workspace's own
 * branding (the Financials screen's "Oak & Co. Internal" tab) substitute
 * the real workspace name from `useWorkspace()` instead. */
export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  OWNERS: "Owners",
  OPERATIONS: "Operations",
  MANAGEMENT: "Management",
};

/** context/07-mockup.jsx CATEGORY_TONE. */
export const EXPENSE_CATEGORY_TONE: Record<ExpenseCategory, "accent" | "teal" | "amber"> = {
  OWNERS: "accent",
  OPERATIONS: "teal",
  MANAGEMENT: "amber",
};

export const MENU_STATION_LABEL: Record<MenuStation, string> = {
  KITCHEN: "Kitchen",
  BAR: "Bar",
  SHOP: "Shop",
  EXPERIENCE: "Experiences",
};

/** Which Order column tracks a given station's fulfillment status — the
 * one shared map every station/status helper reads from, client and
 * server alike (server-side lib/orders.ts re-exports this rather than
 * duplicating it, since this file has no server-only dependencies and
 * client components need the same map without pulling in lib/orders.ts's
 * Prisma import). */
export const STATION_STATUS_FIELD = {
  KITCHEN: "kitchenStatus",
  BAR: "barStatus",
  SHOP: "shopStatus",
  EXPERIENCE: "experienceStatus",
} as const satisfies Record<MenuStation, string>;

/** Order.kitchenStatus/barStatus reuse IssueStatus (Architecture Decision
 * 79) but read as a fulfillment stage here, not an issue lifecycle —
 * separate labels/tones from ISSUE_STATUS_LABEL, same enum values. */
export const ORDER_STATUS_LABEL: Record<IssueStatus, string> = {
  OPEN: "Received",
  IN_PROGRESS: "Preparing",
  RESOLVED: "Delivered",
};

export const ORDER_STATUS_TONE: Record<IssueStatus, "accent" | "amber" | "teal"> = {
  OPEN: "accent",
  IN_PROGRESS: "amber",
  RESOLVED: "teal",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  MOMO: "MoMo",
  CARD: "Card",
};
