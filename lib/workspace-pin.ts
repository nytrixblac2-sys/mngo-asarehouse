import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

/**
 * The owner-controlled PIN gating sensitive HOSTEL actions (deleting an
 * order, changing a menu item's price) — see Workspace.actionPinHash doc
 * comment. Hashed with bcrypt, never stored or transmitted in plaintext;
 * the PIN itself is never returned from any API route.
 */
export async function setWorkspacePin(workspaceId: string, pin: string) {
  const actionPinHash = await bcrypt.hash(pin, 10);
  await prisma.workspace.update({ where: { id: workspaceId }, data: { actionPinHash } });
}

/** True if a PIN has been set for this workspace yet. */
export async function hasWorkspacePin(workspaceId: string): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { actionPinHash: true } });
  return !!workspace?.actionPinHash;
}

/** False if no PIN has been set yet, not just on a wrong guess — callers
 * that gate an action on a correct PIN should also separately surface
 * "the owner hasn't set a PIN yet" via hasWorkspacePin() if that's the
 * actual reason verification can never succeed. */
export async function verifyWorkspacePin(workspaceId: string, pin: string): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { actionPinHash: true } });
  if (!workspace?.actionPinHash) return false;
  return bcrypt.compare(pin, workspace.actionPinHash);
}
