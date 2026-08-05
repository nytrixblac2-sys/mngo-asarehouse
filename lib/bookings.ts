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

export const bookingInputSchema = z.object({
  propertyId: z.string().uuid(),
  guest: z.string().min(1),
  checkIn: dateStringSchema,
  checkOut: dateStringSchema,
  amount: z.number().positive(),
  currency: z.enum(["GHS", "EUR"]),
  source: z.enum(["AIRBNB", "LOCAL"]),
});
