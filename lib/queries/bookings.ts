import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { Booking, BookingSource, Currency, PaymentMethod } from "@/lib/types";

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
  guestEmail: string;
  guestPhone: string;
}

export type BookingInput = RentalBookingInput | HostelBookingInput;

/** Excludes soft-deleted bookings — see useDeletedBookings() for those. */
export function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: () => fetchJson<Booking[]>("/api/bookings"),
  });
}

/** Owner-only "deleted bookings" log (Architecture Decision 93) — the
 * server rejects this for anyone but ACCOUNT_OWNER. */
export function useDeletedBookings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["bookings", "deleted"],
    queryFn: () => fetchJson<Booking[]>("/api/bookings?deletedOnly=true"),
    enabled: options?.enabled ?? true,
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

/** Soft-deletes a booking (Architecture Decision 93) — CO_MANAGER needs
 * the workspace PIN, ACCOUNT_OWNER doesn't. A reason is always required,
 * for the audit trail (see useDeletedBookings). Restorable — see
 * useRestoreBooking. */
export function useDeleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, pin }: { id: string; reason: string; pin?: string }) =>
      fetchJson<Booking>(`/api/bookings/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, pin }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

/** Restores a soft-deleted booking — owner only, no PIN needed (the PIN
 * gate makes deleting harder, not undoing a delete). Rejected server-side
 * if a HOSTEL room is now booked by someone else for the same dates. */
export function useRestoreBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson<Booking>(`/api/bookings/${id}/restore`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
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

/** Corrects an already-confirmed booking's `paidAt` date — for when the
 * "Confirm payout" button wasn't clicked the same day the money actually
 * arrived. Financials/reports bucket income by this date (Architecture
 * Decision 89), so a wrong one silently puts the booking's income in the
 * wrong month — Architecture Decision 90 lets staff fix it directly. Kept
 * separate from useConfirmBookingPayout() (which always confirms as of
 * today) rather than overloading that hook's simple bookingId signature. */
export function useEditPaidAt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, paidAt }: { bookingId: string; paidAt: string }) =>
      fetchJson<Booking>(`/api/bookings/${bookingId}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED", paidAt }),
      }),
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

/** Marks a HOSTEL booking's guest as checked out — stops further ordering,
 * finalizes the receipt, records how the guest paid, and auto-logs a
 * room-cleaning issue. See app/api/bookings/[id]/checkout/route.ts. */
export function useCheckoutBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, paymentMethod }: { bookingId: string; paymentMethod: PaymentMethod }) =>
      fetchJson<Booking>(`/api/bookings/${bookingId}/checkout`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}
