import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/** Thrown by verifyWorkspacePin when the workspace is locked out — callers
 * should surface retryAfterSeconds rather than treating this like a plain
 * wrong guess. */
export class PinLockedError extends Error {
  constructor(public retryAfterSeconds: number) {
    super(`Too many incorrect attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`);
  }
}

/**
 * The owner-controlled PIN gating a menu item's price change — see
 * Workspace.actionPinHash doc comment. Deleting a booking or order used
 * to require this too, but that moved to a pending-request/approval flow
 * instead (Architecture Decision 99) — see lib/bookings.ts deleteBooking
 * and lib/orders.ts deleteOrder. Hashed with bcrypt, never stored or
 * transmitted in plaintext; the PIN itself is never returned from any API
 * route.
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

/**
 * False if no PIN has been set yet, not just on a wrong guess — callers
 * that gate an action on a correct PIN should also separately surface
 * "the owner hasn't set a PIN yet" via hasWorkspacePin() if that's the
 * actual reason verification can never succeed.
 *
 * A 4-digit PIN is only 10,000 combinations — with no throttling, a
 * scripted attacker (or a compromised/malicious staff session, since this
 * is checked after login, not before) could brute-force it in minutes.
 * Locks the workspace's PIN out for LOCKOUT_MINUTES after MAX_ATTEMPTS
 * consecutive wrong guesses; throws PinLockedError instead of just
 * returning false so callers can tell "wrong PIN" from "locked out" and
 * show the retry time. A correct guess always resets the counter, even
 * one submitted right as a lockout is about to expire.
 */
export async function verifyWorkspacePin(workspaceId: string, pin: string): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { actionPinHash: true, pinFailedAttempts: true, pinLockedUntil: true },
  });
  if (!workspace?.actionPinHash) return false;

  if (workspace.pinLockedUntil && workspace.pinLockedUntil.getTime() > Date.now()) {
    throw new PinLockedError(Math.ceil((workspace.pinLockedUntil.getTime() - Date.now()) / 1000));
  }

  const valid = await bcrypt.compare(pin, workspace.actionPinHash);

  if (valid) {
    if (workspace.pinFailedAttempts > 0 || workspace.pinLockedUntil) {
      await prisma.workspace.update({ where: { id: workspaceId }, data: { pinFailedAttempts: 0, pinLockedUntil: null } });
    }
    return true;
  }

  const attempts = workspace.pinFailedAttempts + 1;
  const locking = attempts >= MAX_ATTEMPTS;
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      pinFailedAttempts: locking ? 0 : attempts,
      pinLockedUntil: locking ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
    },
  });
  if (locking) throw new PinLockedError(LOCKOUT_MINUTES * 60);
  return false;
}
