import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { serializeMenuItem } from "@/lib/menu";
import { getGuestSessionBooking } from "@/lib/guest-session";

/** Today's orderable items for the guest's own workspace — scoped via
 * their session cookie so one guest can never see another workspace's
 * menu by guessing a workspaceId. */
export async function GET() {
  const booking = await getGuestSessionBooking();
  if (!booking) return apiError("Not signed in", 401);

  const items = await prisma.menuItem.findMany({
    where: { workspaceId: booking.workspaceId, OR: [{ alwaysAvailable: true }, { isAvailableToday: true }] },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess(items.map(serializeMenuItem));
}
