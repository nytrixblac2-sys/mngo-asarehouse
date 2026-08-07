import { z } from "zod";
import { prisma } from "./prisma";
import type { Currency, Room } from "./types";

type RoomRow = {
  id: string;
  workspaceId: string;
  propertyId: string;
  name: string;
  pricePerNight: unknown;
  currency: Room["currency"];
  active: boolean;
};

export function serializeRoom(r: RoomRow): Room {
  return {
    id: r.id,
    workspaceId: r.workspaceId,
    propertyId: r.propertyId,
    name: r.name,
    pricePerNight: Number(r.pricePerNight),
    currency: r.currency,
    active: r.active,
  };
}

export const roomInputSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1),
  pricePerNight: z.number().positive(),
  currency: z.enum(["GHS", "EUR"]),
  active: z.boolean().optional(),
});

export class RoomBookingError extends Error {}

/**
 * Shared by the authenticated manager booking route and the public guest
 * booking route (Phase 4) — the total is always server-computed from the
 * room's own rate × nights, never trusted from the client, and any
 * overlapping booking on the same room is rejected here rather than left
 * to be discovered later. `excludeBookingId` lets an edit compare against
 * every *other* booking on the room without conflicting with itself.
 */
export async function computeHostelBookingFields(params: {
  workspaceId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  excludeBookingId?: string;
}): Promise<{ amount: number; currency: Currency }> {
  const room = await prisma.room.findUnique({ where: { id: params.roomId } });
  if (!room || room.workspaceId !== params.workspaceId) {
    throw new RoomBookingError("Room not found");
  }
  if (!room.active) {
    throw new RoomBookingError(`${room.name} is not currently bookable`);
  }

  const checkInDate = new Date(params.checkIn);
  const checkOutDate = new Date(params.checkOut);
  const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86_400_000);
  if (nights < 1) {
    throw new RoomBookingError("Check-out must be after check-in");
  }

  const overlap = await findOverlappingBooking({
    roomId: params.roomId,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    excludeBookingId: params.excludeBookingId,
  });
  if (overlap) {
    throw new RoomBookingError(`${room.name} is already booked for part of that date range`);
  }

  return { amount: Number(room.pricePerNight) * nights, currency: room.currency };
}

/** The room double-booking check, factored out so restoreBooking (lib/
 * bookings.ts) can run the exact same overlap rule before un-deleting a
 * HOSTEL booking — another guest may have booked that room for those dates
 * while this one was deleted. Always excludes soft-deleted bookings: a
 * deleted booking must never block a room, restored or not. */
export async function findOverlappingBooking(params: {
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  excludeBookingId?: string;
}) {
  return prisma.booking.findFirst({
    where: {
      roomId: params.roomId,
      deletedAt: null,
      ...(params.excludeBookingId ? { id: { not: params.excludeBookingId } } : {}),
      checkIn: { lt: params.checkOut },
      checkOut: { gt: params.checkIn },
    },
  });
}
