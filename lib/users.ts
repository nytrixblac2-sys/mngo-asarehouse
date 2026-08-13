import { z } from "zod";
import type { User } from "./types";

export interface WorkspaceUser extends User {
  propertyIds: string[];
}

export function serializeWorkspaceUser(u: {
  id: string;
  authId: string;
  workspaceId: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  properties: { propertyId: string }[];
}): WorkspaceUser {
  return {
    id: u.id,
    authId: u.authId,
    workspaceId: u.workspaceId,
    name: u.name,
    email: u.email,
    role: u.role as User["role"],
    mustChangePassword: u.mustChangePassword,
    propertyIds: u.properties.map((p) => p.propertyId),
  };
}

/** context/07-mockup.jsx InviteOwnerForm — name, email, plus which
 * properties they can view (not in the mockup, which has no real
 * per-owner scoping; required here since lib/properties.ts
 * getVisibleProperties actually enforces it). Extended per user decision,
 * 2026-08-01, to also invite Co-Managers: a Co-Manager sees every
 * workspace property already (lib/properties.ts getVisibleProperties
 * returns all properties for any non-PROPERTY_OWNER role), so propertyIds
 * only applies — and is only required — for a PROPERTY_OWNER invite. The
 * Account Owner role is never invited through this form; there is exactly
 * one per workspace, created at signup (lib/workspace-signup.ts). */
export const inviteUserSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(["CO_MANAGER", "PROPERTY_OWNER"]),
    propertyIds: z.array(z.string().uuid()),
  })
  .superRefine((data, ctx) => {
    if (data.role === "PROPERTY_OWNER" && data.propertyIds.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["propertyIds"], message: "Select at least one property" });
    }
  });

/** Manager-generated one-time password — user decision, 2026-07-30/31:
 * no Resend/email infra configured, so the manager hands this to the
 * owner directly (same trust model as texting a WiFi password), rather
 * than sending an invite email. */
export function generateTemporaryPassword(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}
