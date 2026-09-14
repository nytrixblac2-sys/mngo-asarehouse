import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { serializeMenuItem } from "@/lib/menu";

/**
 * Public endpoint — no auth. Returns workspace info + available shop items
 * for the /shop/[slug] guest page. Works for RENTAL workspaces with
 * hasShop=true, and for STORE workspaces unconditionally — a Store's shop
 * is the whole business, not an optional per-workspace toggle. (Whether a
 * STORE's link is actually shareable on its current plan is a separate,
 * later restriction — Stage 4 of the STORE build — not enforced here yet.)
 */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true, type: true, hasShop: true, plan: true },
  });
  if (!workspace) return apiError("Shop not found", 404);
  if (workspace.type !== "STORE" && !workspace.hasShop) {
    return apiError("This workspace does not have a shop", 404);
  }
  // Free-tier Store: the online link itself isn't part of the plan yet —
  // Stage 4 of the STORE build, matching the original scoping decision
  // ("you will not be able to share your link on free forever"). Enforced
  // here, not just hidden in the admin UI, since this is a public,
  // unauthenticated route — a hidden link in the admin screen does
  // nothing if the URL itself still works.
  if (workspace.type === "STORE" && workspace.plan === "FREE") {
    return apiError("This store isn't sharing online orders yet.", 403);
  }

  const items = await prisma.menuItem.findMany({
    where: { workspaceId: workspace.id, station: "SHOP", alwaysAvailable: true },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess({ workspace, items: items.map(serializeMenuItem) });
}
