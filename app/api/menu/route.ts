import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { menuItemInputSchema, serializeMenuItem } from "@/lib/menu";

/** All menu items in the workspace, open to every role — needed by both
 * the Kitchen curation screen and the guest/staff ordering flows. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const rows = await prisma.menuItem.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess(rows.map(serializeMenuItem));
}

/** Adds a dish/drink to the master menu. `alwaysAvailable` items need no
 * daily toggle; anything else starts unavailable until Janet turns it on
 * for a given day from the Kitchen screen. Managers only. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = menuItemInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  // Inventory tracking is Starter-and-up (Stage 4 of the STORE build) —
  // enforced here too, not just hidden in the Add Product form, since the
  // form omitting the checkbox doesn't stop a direct API call.
  if (parsed.data.stockQuantity != null) {
    const workspace = await prisma.workspace.findUnique({ where: { id: user.workspaceId }, select: { type: true, plan: true } });
    if (workspace?.type === "STORE" && workspace.plan === "FREE") {
      return apiError("Inventory tracking requires the Starter plan or higher.", 403);
    }
  }

  const created = await prisma.menuItem.create({
    data: {
      workspaceId: user.workspaceId,
      name: parsed.data.name,
      category: parsed.data.category,
      price: parsed.data.price,
      currency: parsed.data.currency,
      alwaysAvailable: parsed.data.alwaysAvailable ?? false,
      isAvailableToday: false,
      station: parsed.data.station ?? "KITCHEN",
      imageUrl: parsed.data.imageUrl ?? null,
      stockQuantity: parsed.data.stockQuantity ?? null,
    },
  });

  return apiSuccess(serializeMenuItem(created));
}
