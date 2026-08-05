import { z } from "zod";
import type { Issue, IssueStatus } from "./types";

type IssueRow = {
  id: string;
  workspaceId: string;
  propertyId: string;
  date: Date;
  type: Issue["type"];
  description: string;
  guest: string | null;
  roomId: string | null;
  status: IssueStatus | null;
  statusHistory: { status: IssueStatus; note: string | null; at: Date }[];
};

export function serializeIssue(i: IssueRow): Issue {
  return {
    id: i.id,
    workspaceId: i.workspaceId,
    propertyId: i.propertyId,
    date: i.date.toISOString().slice(0, 10),
    type: i.type,
    description: i.description,
    guest: i.guest,
    roomId: i.roomId,
    status: i.status,
    statusHistory: i.statusHistory.map((h) => ({ status: h.status, note: h.note, at: h.at.toISOString() })),
  };
}

export const issueInputSchema = z.object({
  propertyId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  type: z.enum(["GUEST_COMPLAINT", "MAINTENANCE", "NOTE"]),
  description: z.string().min(1),
  guest: z.string().optional(),
});

export const issueStatusInputSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
  note: z.string().optional(),
});
