import { z } from "zod";
import type { TeamMember } from "./types";

type TeamMemberRow = {
  id: string;
  workspaceId: string;
  name: string;
  role: string;
};

export function serializeTeamMember(t: TeamMemberRow): TeamMember {
  return { id: t.id, workspaceId: t.workspaceId, name: t.name, role: t.role };
}

export const teamMemberInputSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
});
