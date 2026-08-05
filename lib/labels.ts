import type { BookingSource, ExpenseCategory, IssueStatus, IssueType, ScheduleType } from "./types";

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
