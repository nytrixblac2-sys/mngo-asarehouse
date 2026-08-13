import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { PinLockedError, verifyWorkspacePin } from "@/lib/workspace-pin";

const verifyPinInputSchema = z.object({ pin: z.string().min(1) });

/**
 * Checks a submitted PIN against the workspace's action PIN, without
 * performing the gated action itself — used by the UI to validate before
 * showing e.g. a delete-reason field. The actual delete/price-change
 * endpoints independently re-verify the PIN server-side too (never trust
 * the client's word that this check already passed).
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = verifyPinInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  try {
    const valid = await verifyWorkspacePin(user.workspaceId, parsed.data.pin);
    return apiSuccess({ valid });
  } catch (err) {
    if (err instanceof PinLockedError) return apiError(err.message, 429);
    throw err;
  }
}
