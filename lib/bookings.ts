import { z } from "zod";
import { prisma } from "./prisma";
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
  deleteRequestedAt: Date | null;
  deleteRequestedBy: string | null;
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
    deleteRequestedAt: b.deleteRequestedAt ? b.deleteRequestedAt.toISOString() : null,
    deleteRequestedBy: b.deleteRequestedBy,
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
});

export class BookingError extends Error {}

/**
 * Deletes a booking, or requests its deletion (Architecture Decision 99).
 * ACCOUNT_OWNER deletes immediately, exactly as before — they're already
 * the approver, there's no one else to ask. Anyone else's delete becomes
 * a pending request instead: deletedAt stays null, deleteRequestedAt/By
 * are set, and the booking stays fully active/visible everywhere until
 * approveBookingDeletion or rejectBookingDeletion resolves it. Replaces
 * the previous PIN-gate for deletion specifically (menu price changes
 * still use the PIN, see lib/workspace-pin.ts). A reason is always
 * required, for the audit trail either way.
 */
export async function deleteBooking(params: {
  workspaceId: string;
  bookingId: string;
  actorRole: "ACCOUNT_OWNER" | "CO_MANAGER" | "PROPERTY_OWNER";
  actorName: string;
  reason: string;
}) {
  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId } });
  if (!booking || booking.workspaceId !== params.workspaceId) {
    throw new BookingError("Booking not found");
  }
  if (booking.deletedAt) {
    throw new BookingError("This booking was already deleted");
  }
  if (booking.deleteRequestedAt) {
    throw new BookingError("A deletion request is already pending for this booking");
  }

  if (params.actorRole === "ACCOUNT_OWNER") {
    return prisma.booking.update({
      where: { id: params.bookingId },
      data: { deletedAt: new Date(), deletedBy: params.actorName, deleteReason: params.reason.trim() },
    });
  }

  return prisma.booking.update({
    where: { id: params.bookingId },
    data: { deleteRequestedAt: new Date(), deleteRequestedBy: params.actorName, deleteReason: params.reason.trim() },
  });
}

/** Owner approves a pending delete request, finalizing it into an actual
 * soft-delete. `deletedBy` credits whoever originally requested it, not
 * the approving owner — matches the deleted-log's existing "who caused
 * this" semantics. */
export async function approveBookingDeletion(params: { workspaceId: string; bookingId: string }) {
  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId } });
  if (!booking || booking.workspaceId !== params.workspaceId) {
    throw new BookingError("Booking not found");
  }
  if (!booking.deleteRequestedAt) {
    throw new BookingError("No pending deletion request for this booking");
  }

  return prisma.booking.update({
    where: { id: params.bookingId },
    data: {
      deletedAt: new Date(),
      deletedBy: booking.deleteRequestedBy,
      deleteRequestedAt: null,
      deleteRequestedBy: null,
    },
  });
}

/** Owner rejects a pending delete request — nothing is deleted, the
 * request (and its reason) is just cleared, leaving the booking exactly
 * as it was before it was asked. */
export async function rejectBookingDeletion(params: { workspaceId: string; bookingId: string }) {
  const booking = await prisma.booking.findUnique({ where: { id: params.bookingId } });
  if (!booking || booking.workspaceId !== params.workspaceId) {
    throw new BookingError("Booking not found");
  }
  if (!booking.deleteRequestedAt) {
    throw new BookingError("No pending deletion request for this booking");
  }

  return prisma.booking.update({
    where: { id: params.bookingId },
    data: { deleteRequestedAt: null, deleteRequestedBy: null, deleteReason: null },
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
