import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { hasWorkspacePin, PinLockedError, setWorkspacePin, verifyWorkspacePin } from "@/lib/workspace-pin";

const setPinInputSchema = z.object({
  newPin: z.string().regex(/^\d{4,8}$/, "PIN must be 4-8 digits"),
  currentPin: z.string().optional(),
});

/**
 * Sets or changes the workspace's action PIN — gates order deletion and
 * menu price changes (Architecture Decision 79). Owner only; if a PIN is
 * already set, the current one must be supplied to change it, same as
 * any password-change flow, so losing access to a preview session can't
 * silently take over the gate.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role !== "ACCOUNT_OWNER") return apiError("Forbidden", 403);

  const parsed = setPinInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const alreadySet = await hasWorkspacePin(user.workspaceId);
  if (alreadySet) {
    try {
      if (!parsed.data.currentPin || !(await verifyWorkspacePin(user.workspaceId, parsed.data.currentPin))) {
        return apiError("Current PIN is incorrect", 403);
      }
    } catch (err) {
      if (err instanceof PinLockedError) return apiError(err.message, 429);
      throw err;
    }
  }

  await setWorkspacePin(user.workspaceId, parsed.data.newPin);
  return apiSuccess({ ok: true });
}
