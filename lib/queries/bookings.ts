import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { Booking, BookingSource, Currency } from "@/lib/types";

export interface RentalBookingInput {
  propertyId: string;
  guest: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  currency: Currency;
  source: BookingSource;
}

/** HOSTEL-workspace shape — server derives amount/currency/source from the
 * room's rate (lib/rooms.ts computeHostelBookingFields). */
export interface HostelBookingInput {
  propertyId: string;
  guest: string;
  checkIn: string;
  checkOut: string;
  roomId: string;
  passportNumber: string;
  guestEmail?: string;
  guestPhone?: string;
}

export type BookingInput = RentalBookingInput | HostelBookingInput;

export function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: () => fetchJson<Booking[]>("/api/bookings"),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BookingInput) =>
      fetchJson<Booking>("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BookingInput }) =>
      fetchJson<Booking>(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson<{ id: string }>(`/api/bookings/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export interface BulkImportInput {
  propertyId: string;
  bookings: Omit<BookingInput, "propertyId">[];
  /** Applies to every row — see Architecture Decision 63. Defaults
   * server-side to EXPECTED if omitted. */
  status?: "CONFIRMED" | "EXPECTED";
}

/** Historical backfill or future-stay import (Architecture Decisions 31,
 * 44, 63) — `status` is caller-supplied per batch, not always CONFIRMED. */
export function useBulkImportBookings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkImportInput) =>
      fetchJson<Booking[]>("/api/bookings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

/** context/01-project-overview.md: booking detail modal's "Confirm
 * payment (records paid_at date)" / Dashboard's "Confirm payout" button. */
export function useConfirmBookingPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) =>
      fetchJson<Booking>(`/api/bookings/${bookingId}/confirm`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

/** Reverts a booking back to EXPECTED (clears `paidAt`) — for when a
 * booking was marked CONFIRMED but the money hasn't actually arrived yet.
 * User clarification, 2026-08-04: "confirmed" means payment was actually
 * sent, not just that the booking exists — the bulk CSV importer had been
 * marking every imported row CONFIRMED regardless of real payment status. */
export function useUnconfirmBookingPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) =>
      fetchJson<Booking>(`/api/bookings/${bookingId}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "EXPECTED" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
