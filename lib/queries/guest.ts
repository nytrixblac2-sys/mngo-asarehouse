import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { Booking, MenuItem, Order, Room } from "@/lib/types";

export interface GuestBill {
  booking: Booking;
  room: Room | null;
  orders: Order[];
  roomCharge: number;
  foodTotal: number;
  grandTotal: number;
}

/** Public counterparts to lib/queries/{menu,orders}.ts — hit /api/public/*
 * (guest-session-cookie auth) instead of /api/* (staff-login auth), used
 * only from app/track. `retry: false` so a 401 (not signed in yet) fails
 * fast instead of TanStack Query's default retry-with-backoff, which
 * would leave the track page's "am I signed in" check hanging. */
export function useGuestBill() {
  return useQuery({
    queryKey: ["guest", "bill"],
    queryFn: () => fetchJson<GuestBill>("/api/public/bill"),
    retry: false,
  });
}

export function useGuestMenu(enabled: boolean) {
  return useQuery({
    queryKey: ["guest", "menu"],
    queryFn: () => fetchJson<MenuItem[]>("/api/public/menu"),
    enabled,
    retry: false,
  });
}

export function useGuestTrack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { bookingCode: string; guestName: string }) =>
      fetchJson<Booking>("/api/public/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest"] }),
  });
}

export function useGuestOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: { menuItemId: string; quantity: number }[]) =>
      fetchJson<Order>("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest", "bill"] }),
  });
}

export function useGuestLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetchJson<{ ok: boolean }>("/api/public/logout", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guest"] }),
  });
}
