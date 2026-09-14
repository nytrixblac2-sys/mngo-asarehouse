import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { serializeStockAdjustment } from "@/lib/stock";

/** Every stock adjustment in the workspace (sales and manual restocks/
 * corrections alike), newest first — the Shop admin screen's Inventory
 * tab groups these by item client-side rather than fetching per-item. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const rows = await prisma.stockAdjustment.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(rows.map(serializeStockAdjustment));
}
