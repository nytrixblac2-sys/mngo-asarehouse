"use client";

import { useWorkspace } from "@/lib/queries/workspace";
import { useRooms } from "@/lib/queries/rooms";
import type { Booking, Property } from "@/lib/types";
import type { BookingInput } from "@/lib/queries/bookings";
import { BookingForm } from "./booking-form";
import { HostelBookingForm } from "./hostel-booking-form";

/**
 * Picks BookingForm (free-typed amount/source, RENTAL workspaces) or
 * HostelBookingForm (room + passport, server-computed total, HOSTEL
 * workspaces) so the three call sites that open a booking form
 * (app/(app)/bookings/page.tsx, booking-detail-modal.tsx, per-stay-view.tsx)
 * don't each need their own workspace-type branch. Defaults to
 * BookingForm while the workspace type is still loading, same
 * fail-safe-to-RENTAL default as lib/nav.ts getNavItems.
 */
export function BookingFormRouter({
  onClose,
  onSubmit,
  booking,
  properties,
  defaultPropertyId,
  isPending,
  error,
}: {
  onClose: () => void;
  onSubmit: (input: BookingInput) => void;
  booking?: Booking;
  properties: Property[];
  defaultPropertyId: string;
  isPending?: boolean;
  error?: string | null;
}) {
  const workspace = useWorkspace().data;
  const rooms = useRooms().data ?? [];

  if (workspace?.type === "HOSTEL") {
    return (
      <HostelBookingForm
        onClose={onClose}
        onSubmit={onSubmit}
        booking={booking}
        properties={properties}
        rooms={rooms}
        defaultPropertyId={defaultPropertyId}
        isPending={isPending}
        error={error}
      />
    );
  }

  return (
    <BookingForm
      onClose={onClose}
      onSubmit={onSubmit}
      booking={booking}
      properties={properties}
      defaultPropertyId={defaultPropertyId}
      isPending={isPending}
      error={error}
    />
  );
}
