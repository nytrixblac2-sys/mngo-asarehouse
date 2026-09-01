import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { serializeMenuItem } from "@/lib/menu";

/**
 * Public endpoint — no auth. Returns workspace info + available shop items
 * for the /shop/[slug] guest page. Only works for workspaces with hasShop=true.
 */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, slug: true, type: true, hasShop: true },
  });
  if (!workspace) return apiError("Shop not found", 404);
  if (!workspace.hasShop) return apiError("This workspace does not have a shop", 404);

  const items = await prisma.menuItem.findMany({
    where: { workspaceId: workspace.id, station: "SHOP", alwaysAvailable: true },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess({ workspace, items: items.map(serializeMenuItem) });
}
