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
export type IssueType = "GUEST_COMPLAINT" | "MAINTENANCE" | "NOTE";
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
