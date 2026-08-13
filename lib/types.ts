/**
 * Canonical MNGO types — see context/03-code-standards.md:
 * "The Booking, Expense, Property, Issue, Schedule, and User types are
 * canonical — import from lib/types.ts, never redefine locally."
 *
 * These mirror prisma/schema.prisma but describe the client-facing JSON
 * shape returned by app/api routes: Decimal -> number, Date -> ISO date
 * string ("YYYY-MM-DD"), DateTime -> ISO timestamp string.
 */

export type Role = "ACCOUNT_OWNER" | "CO_MANAGER" | "PROPERTY_OWNER";

/** GHS and EUR only — never mixed, converted, or aggregated. */
export type Currency = "GHS" | "EUR";

/** "WEBSITE" is a HOSTEL-workspace guest self-service booking (app/book/[slug])
 * — never client-supplied on the authenticated staff booking form, which
 * only ever sends "AIRBNB"|"LOCAL". */
export type BookingSource = "AIRBNB" | "LOCAL" | "WEBSITE";
export type BookingStatus = "EXPECTED" | "CONFIRMED";

export type WorkspaceType = "RENTAL" | "HOSTEL";

/** "MANAGEMENT" is the generic term for the management company's cut — Oak
 * & Co. is the reference workspace's display name, not a schema value. */
export type ExpenseCategory = "OWNERS" | "OPERATIONS" | "MANAGEMENT";

export type ScheduleType = "CLEANING" | "REPAIR" | "SUPERVISION" | "TRAINING";
/** Which of the Kitchen/Bar screens a menu item's orders show up on. */
export type MenuStation = "KITCHEN" | "BAR" | "SHOP" | "EXPERIENCE";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "MOMO" | "CARD";
/** "ROOM_DIRTY" is auto-created server-side on HOSTEL checkout
 * (app/api/bookings/[id]/checkout) — never user-selectable when manually
 * creating an issue (lib/issues.ts issueInputSchema still only accepts the
 * other three). */
export type IssueType = "GUEST_COMPLAINT" | "MAINTENANCE" | "NOTE" | "ROOM_DIRTY";
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

/** Income split for one currency; values are percentages that must sum to 100. */
export interface Allocation {
  owners: number;
  operations: number;
  management: number;
}

/** Running balance carried forward from before MNGO tracked this property. */
export interface PrevBalance {
  owners: number;
  management: number;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  type: WorkspaceType;
  accountOwnerId: string;
}

export interface User {
  id: string;
  authId: string;
  workspaceId: string;
  name: string;
  email: string;
  role: Role;
  /** True while this user is still on their manager-issued one-time invite
   * password — the (app) layout redirects to /change-password until it's
   * false. Always false for the Account Owner (chooses their own password
   * at signup). */
  mustChangePassword: boolean;
  /** Only ever set on a PROPERTY_OWNER row, and only populated when this
   * User is being used as an owner-preview target (store/use-app-store.ts
   * previewUser) — lets useProperties() (lib/queries/properties.ts) scope
   * the property list to what that owner can actually see during preview,
   * same as the server already does for their real session
   * (lib/properties.ts getVisibleProperties). Absent/undefined for the
   * real signed-in user. */
  propertyIds?: string[];
}

export interface Property {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  rooms: string[];
  facilities: string[];
  currencies: Currency[];
  allocation: Partial<Record<Currency, Allocation>>;
  prevBalanceGhs: PrevBalance;
  prevBalanceEur: PrevBalance;
}

/** HOSTEL-workspace-only priced room type — see prisma/schema.prisma Room
 * doc comment. `Property.rooms: String[]` (above) is unrelated decorative
 * free text used by RENTAL workspaces; this is the real, bookable entity. */
export interface Room {
  id: string;
  workspaceId: string;
  propertyId: string;
  name: string;
  pricePerNight: number;
  currency: Currency;
  active: boolean;
}

/** HOSTEL-workspace-only master menu row. `category` is free text
 * (e.g. "Food"/"Desserts"/"Breakfast" for Escape3Points), not an enum —
 * menu structure is workspace-specific. `isAvailableToday` is the single
 * live toggle staff use on the Kitchen screen to curate what guests (and
 * staff ordering on a guest's behalf) can currently order. */
export interface MenuItem {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  price: number;
  currency: Currency;
  /** Doesn't change day to day (breakfast, drinks, the all-day menu) —
   * orderable at all times, no daily toggle needed. */
  alwaysAvailable: boolean;
  /** The daily toggle staff use for genuinely rotating items (e.g. lunch
   * and dinner mains). Ignored when `alwaysAvailable` is true. */
  isAvailableToday: boolean;
  /** Which of the Kitchen/Bar/Shop/Experiences screens this item's orders
   * show up on. */
  station: MenuStation;
}

/** A snapshot of one menu item within an Order — `name`/`unitPrice`/
 * `currency`/`station` are captured at order time so a later menu edit
 * (price change or reclassifying which station prepares it) never
 * rewrites a guest's past bill or which screen a historical order
 * appeared on. `menuItemId` is nullable — it's set null if the underlying
 * MenuItem is later deleted (Architecture Decision 91); the snapshot
 * fields above are what make this row meaningful either way, nothing
 * reads menuItemId back off an existing order. */
export interface OrderItem {
  id: string;
  menuItemId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  currency: Currency;
  station: MenuStation;
}

/** A guest's order against their stay — one Booking can have many Orders
 * (e.g. one per sitting). `kitchenStatus`/`barStatus`/`shopStatus`/
 * `experienceStatus` are independent (reusing IssueStatus —
 * OPEN/IN_PROGRESS/RESOLVED, shown as Received/Preparing/Delivered): set
 * at creation to OPEN if the order has any item for that station, else
 * null, so a mixed order becomes one independently-tracked ticket per
 * station. `deletedAt`/`deletedBy`/`deleteReason` are a soft delete —
 * null on every order until then. */
export interface Order {
  id: string;
  workspaceId: string;
  bookingId: string;
  createdAt: string;
  kitchenStatus: IssueStatus | null;
  barStatus: IssueStatus | null;
  shopStatus: IssueStatus | null;
  experienceStatus: IssueStatus | null;
  deletedAt: string | null;
  deletedBy: string | null;
  deleteReason: string | null;
  /** Same pending-request/approval mechanism as Booking (Architecture
   * Decision 99) — see its doc comment. */
  deleteRequestedAt: string | null;
  deleteRequestedBy: string | null;
  items: OrderItem[];
}

export interface Booking {
  id: string;
  workspaceId: string;
  propertyId: string;
  guest: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  currency: Currency;
  source: BookingSource;
  status: BookingStatus;
  /** Set server-side only, at the moment of confirmation. Never client-supplied. */
  paidAt: string | null;
  /** HOSTEL-only fields below — always null for RENTAL-workspace bookings. */
  roomId: string | null;
  passportNumber: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  /** Guest's lookup code for the public /track page. */
  bookingCode: string | null;
  /** Set server-side only, when staff check the guest out. Never client-supplied. */
  checkedOutAt: string | null;
  /** How the guest paid, selected at checkout. Null until checkout. */
  paymentMethod: PaymentMethod | null;
  /** Soft-deleted bookings never appear here except via the owner-only
   * deleted-bookings log (Architecture Decision 93) — deletedAt set means
   * the other two are too. */
  deletedAt: string | null;
  deletedBy: string | null;
  deleteReason: string | null;
  /** A CO_MANAGER's delete request, pending ACCOUNT_OWNER approval
   * (Architecture Decision 99) — the booking stays fully active/visible
   * everywhere while this is set; deletedAt only gets set once approved. */
  deleteRequestedAt: string | null;
  deleteRequestedBy: string | null;
}

export interface Expense {
  id: string;
  workspaceId: string;
  propertyId: string;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  person: string | null;
}

/** Manual income entries — owner contributions, top-ups. */
export interface ManualIncome {
  id: string;
  workspaceId: string;
  propertyId: string;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
}

/** Status change timeline shared by Schedule and Issue — reuses IssueStatus
 * (OPEN/IN_PROGRESS/RESOLVED) for both, per the user's 2026-08-01 request
 * for schedule status to work "just like the way the status for the
 * issues." `note` is optional free text on what happened at that change. */
export interface StatusEvent {
  status: IssueStatus;
  note: string | null;
  at: string;
}

export interface Schedule {
  id: string;
  workspaceId: string;
  propertyId: string;
  type: ScheduleType;
  date: string;
  assignedTo: string;
  note: string | null;
  status: IssueStatus;
  statusHistory: StatusEvent[];
}

export type IssueStatusEvent = StatusEvent;

export interface Issue {
  id: string;
  workspaceId: string;
  propertyId: string;
  date: string;
  type: IssueType;
  description: string;
  guest: string | null;
  /** Set only for a server-created ROOM_DIRTY issue (booking checkout) —
   * ties the issue to the specific room, same pattern as Booking.roomId. */
  roomId: string | null;
  /** null for NOTE-type issues — they never enter the Open/In
   * Progress/Resolved lifecycle. */
  status: IssueStatus | null;
  statusHistory: IssueStatusEvent[];
}

/** Payment history is derived from Expense rows (category "MANAGEMENT",
 * person = name) — there is no separate payments table. */
export interface TeamMember {
  id: string;
  workspaceId: string;
  name: string;
  role: string;
}
