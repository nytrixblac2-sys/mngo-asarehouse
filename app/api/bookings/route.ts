import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { bookingInputSchema, serializeBooking } from "@/lib/bookings";
import { computeHostelBookingFields, RoomBookingError } from "@/lib/rooms";
import { uniqueBookingCode } from "@/lib/booking-code";

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

  if ("roomId" in parsed.data) {
    let fields;
    try {
      fields = await computeHostelBookingFields({
        workspaceId: user.workspaceId,
        roomId: parsed.data.roomId,
        checkIn: parsed.data.checkIn,
        checkOut: parsed.data.checkOut,
      });
    } catch (err) {
      if (err instanceof RoomBookingError) return apiError(err.message, 409);
      throw err;
    }

    // Every HOSTEL booking gets a bookingCode, staff-entered walk-ins
    // included — not just guest self-service ones (app/api/public/bookings)
    // — otherwise a guest Janet checks in manually has no way to ever sign
    // into /track to see their bill or order food.
    const bookingCode = await uniqueBookingCode();

    const created = await prisma.booking.create({
      data: {
        workspaceId: user.workspaceId,
        propertyId: parsed.data.propertyId,
        guest: parsed.data.guest,
        checkIn: new Date(parsed.data.checkIn),
        checkOut: new Date(parsed.data.checkOut),
        amount: fields.amount,
        currency: fields.currency,
        source: "LOCAL",
        status: "EXPECTED",
        roomId: parsed.data.roomId,
        passportNumber: parsed.data.passportNumber,
        guestEmail: parsed.data.guestEmail,
        guestPhone: parsed.data.guestPhone,
        bookingCode,
      },
    });
    return apiSuccess(serializeBooking(created));
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
