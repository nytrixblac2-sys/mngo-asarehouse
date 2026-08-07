import { z } from "zod";
import { prisma } from "./prisma";
import { verifyWorkspacePin } from "./workspace-pin";
import { findOverlappingBooking } from "./rooms";
import type { Booking } from "./types";

type BookingRow = {
  id: string;
  workspaceId: string;
  propertyId: string;
  guest: string;
  checkIn: Date;
  checkOut: Date;
  amount: unknown;
  currency: Booking["currency"];
  source: Booking["source"];
  status: Booking["status"];
  paidAt: Date | null;
  roomId: string | null;
  passportNumber: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  bookingCode: string | null;
  checkedOutAt: Date | null;
  paymentMethod: Booking["paymentMethod"];
  deletedAt: Date | null;
  deletedBy: string | null;
  deleteReason: string | null;
};

export function serializeBooking(b: BookingRow): Booking {
  return {
    id: b.id,
    workspaceId: b.workspaceId,
    propertyId: b.propertyId,
    guest: b.guest,
    checkIn: b.checkIn.toISOString().slice(0, 10),
    checkOut: b.checkOut.toISOString().slice(0, 10),
    amount: Number(b.amount),
    currency: b.currency,
    source: b.source,
    status: b.status,
    paidAt: b.paidAt ? b.paidAt.toISOString().slice(0, 10) : null,
    roomId: b.roomId,
    passportNumber: b.passportNumber,
    guestEmail: b.guestEmail,
    guestPhone: b.guestPhone,
    bookingCode: b.bookingCode,
    checkedOutAt: b.checkedOutAt ? b.checkedOutAt.toISOString() : null,
    paymentMethod: b.paymentMethod,
    deletedAt: b.deletedAt ? b.deletedAt.toISOString() : null,
    deletedBy: b.deletedBy,
    deleteReason: b.deleteReason,
  };
}

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

/** RENTAL-workspace shape — free-typed amount/currency/source, as always. */
export const rentalBookingInputSchema = z.object({
  propertyId: z.string().uuid(),
  guest: z.string().min(1),
  checkIn: dateStringSchema,
  checkOut: dateStringSchema,
  amount: z.number().positive(),
  currency: z.enum(["GHS", "EUR"]),
  source: z.enum(["AIRBNB", "LOCAL"]),
});

/** HOSTEL-workspace shape — a room + passport, no amount/currency/source:
 * the server derives those from the room's rate (lib/rooms.ts
 * computeHostelBookingFields) and always sets source to LOCAL for
 * staff-entered bookings (guest self-bookings go through a separate public
 * route that sets WEBSITE — Phase 4). */
export const hostelBookingInputSchema = z.object({
  propertyId: z.string().uuid(),
  guest: z.string().min(1),
  checkIn: dateStringSchema,
  checkOut: dateStringSchema,
  roomId: z.string().uuid(),
  passportNumber: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(1),
});

/** Discriminated by shape, not an explicit tag: a hostel-shaped payload is
 * missing amount/currency/source (fails rental), a rental-shaped payload is
 * missing roomId/passportNumber (fails hostel) — so each request matches
 * exactly one branch. */
export const bookingInputSchema = z.union([hostelBookingInputSchema, rentalBookingInputSchema]);

/** How the guest paid, collected at checkout — see
 * app/api/bookings/[id]/checkout/route.ts. */
export const checkoutInputSchema = z.object({
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "MOMO", "CARD"]),
});

export const bookingDeleteInputSchema = z.object({
  reason: z.string().min(1),
  /** Required for a CO_MANAGER-initiated delete, ignored for
   * ACCOUNT_OWNER — see deleteBooking. */
  pin: z.string().optional(),
});

export class BookingError extends Error {}

/**
 * Soft-deletes a booking (Architecture Decision 93) — same rule as
 * deleteOrder (lib/orders.ts, Architecture Decision 79): CO_MANAGER needs
 * the workspace PIN, the ACCOUNT_OWNER (who sets the PIN) can delete
 * without it. A reason is always required either way, for the audit trail.
 * Unlike orders, a deleted booking can be restored — see restoreBooking.
 */
export async function deleteBooking(params: {
  workspaceId: string;
  bookingId: string;
  actorRole: "ACCOUNT_OWNER" | "CO_MANAGER" | "PROPERTY_OWNER";
  actorName: string;
  reason: string;
  pin?: string;
}) {
  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId } });
  if (!booking || booking.workspaceId !== params.workspaceId) {
    throw new BookingError("Booking not found");
  }
  if (booking.deletedAt) {
    throw new BookingError("This booking was already deleted");
  }

  if (params.actorRole !== "ACCOUNT_OWNER") {
    if (!params.pin || !(await verifyWorkspacePin(params.workspaceId, params.pin))) {
      throw new BookingError("Incorrect PIN");
    }
  }

  return prisma.booking.update({
    where: { id: params.bookingId },
    data: { deletedAt: new Date(), deletedBy: params.actorName, deleteReason: params.reason.trim() },
  });
}

/**
 * Restores a soft-deleted booking — owner only (same gate as viewing the
 * deleted-bookings log; matches deleteOrder's "owner sees the audit trail"
 * reasoning). For a HOSTEL booking, re-checks the room isn't now booked by
 * someone else for the same dates before restoring — another guest may
 * have taken that room while this booking was deleted. RENTAL bookings
 * have no room to conflict over, so they always restore cleanly.
 */
export async function restoreBooking(params: { workspaceId: string; bookingId: string }) {
  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId } });
  if (!booking || booking.workspaceId !== params.workspaceId) {
    throw new BookingError("Booking not found");
  }
  if (!booking.deletedAt) {
    throw new BookingError("This booking isn't deleted");
  }

  if (booking.roomId) {
    const overlap = await findOverlappingBooking({
      roomId: booking.roomId,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      excludeBookingId: booking.id,
    });
    if (overlap) {
      throw new BookingError("Can't restore — this room is now booked by someone else for part of that date range");
    }
  }

  return prisma.booking.update({
    where: { id: params.bookingId },
    data: { deletedAt: null, deletedBy: null, deleteReason: null },
  });
}

/** Public guest self-service booking (app/book/[slug]) — no `propertyId`
 * (derived server-side from the chosen room, since a guest never sees or
 * picks a property directly) and no staff-only fields. */
export const publicBookingInputSchema = z.object({
  workspaceSlug: z.string().min(1),
  roomId: z.string().uuid(),
  guest: z.string().min(1),
  checkIn: dateStringSchema,
  checkOut: dateStringSchema,
  passportNumber: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(1),
});
