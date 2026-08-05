import { z } from "zod";
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
