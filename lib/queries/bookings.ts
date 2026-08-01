import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { Booking, BookingSource, Currency } from "@/lib/types";

export interface BookingInput {
  propertyId: string;
  guest: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  currency: Currency;
  source: BookingSource;
}

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
}

/** Historical backfill (Architecture Decisions 31, 44) — creates every
 * row CONFIRMED with `paidAt` server-set, not EXPECTED. */
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
