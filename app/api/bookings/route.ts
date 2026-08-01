import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { bookingInputSchema, serializeBooking } from "@/lib/bookings";

/**
 * All bookings visible to the requesting user's workspace — scoped to
 * assigned properties only for PROPERTY_OWNER (context/02-architecture-context.md
 * "Auth and Access Control Model"). No property/date filtering server-side;
 * the client filters by active property and period, per "Financial
 * Calculation Model": "The API returns full booking and expense records;
 * the client computes ... dynamically."
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const propertyFilter =
    user.role === "PROPERTY_OWNER" ? { property: { owners: { some: { userId: user.id } } } } : {};

  const rows = await prisma.booking.findMany({
    where: { workspaceId: user.workspaceId, ...propertyFilter },
    orderBy: { checkIn: "asc" },
  });

  return apiSuccess(rows.map(serializeBooking));
}

/**
 * Creates a booking. `status` is always EXPECTED here, never client-supplied
 * — context/07-mockup.jsx BookingForm defaults new bookings to 'expected';
 * moving to CONFIRMED only happens through PATCH /api/bookings/[id]/confirm,
 * which is also where `paidAt` gets set (context/02-architecture-context.md
 * invariant #4). Managers only, matching canEdit gating in the mockup.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (user.role === "PROPERTY_OWNER") return apiError("Forbidden", 403);

  const parsed = bookingInputSchema.safeParse(await req.json());
  if (!parsed.success) return apiError(parsed.error.message, 400);

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property || property.workspaceId !== user.workspaceId) {
    return apiError("Property not found", 404);
  }

  const created = await prisma.booking.create({
    data: {
      workspaceId: user.workspaceId,
      propertyId: parsed.data.propertyId,
      guest: parsed.data.guest,
      checkIn: new Date(parsed.data.checkIn),
      checkOut: new Date(parsed.data.checkOut),
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      source: parsed.data.source,
      status: "EXPECTED",
    },
  });

  return apiSuccess(serializeBooking(created));
}
