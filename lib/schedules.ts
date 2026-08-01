import { z } from "zod";
import type { Schedule, IssueStatus } from "./types";

type ScheduleRow = {
  id: string;
  workspaceId: string;
  propertyId: string;
  type: Schedule["type"];
  date: Date;
  assignedTo: string;
  note: string | null;
  status: IssueStatus;
  statusHistory: { status: IssueStatus; note: string | null; at: Date }[];
};

export function serializeSchedule(s: ScheduleRow): Schedule {
  return {
    id: s.id,
    workspaceId: s.workspaceId,
    propertyId: s.propertyId,
    type: s.type,
    date: s.date.toISOString().slice(0, 10),
    assignedTo: s.assignedTo,
    note: s.note,
    status: s.status,
    statusHistory: s.statusHistory.map((h) => ({ status: h.status, note: h.note, at: h.at.toISOString() })),
  };
}

export const scheduleInputSchema = z.object({
  propertyId: z.string().uuid(),
  type: z.enum(["CLEANING", "REPAIR", "SUPERVISION", "TRAINING"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  assignedTo: z.string().min(1),
  note: z.string().optional(),
});

/** Mirrors lib/issues.ts issueStatusInputSchema — same status-change +
 * optional note primitive, applied to schedules. */
export const scheduleStatusInputSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
  note: z.string().optional(),
});
