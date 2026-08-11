import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { IssueStatus, MenuStation, Order } from "@/lib/types";

export interface OrderInput {
  bookingId: string;
  items: { menuItemId: string; quantity: number }[];
}

/** Pass a bookingId to scope to one guest's stay (booking detail view);
 * omit for every order in the workspace. `enabled` lets a RENTAL-workspace
 * caller skip the request entirely rather than fetching data it'll never use.
 * Always excludes soft-deleted orders — see useDeletedOrders() for those. */
export function useOrders(bookingId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["orders", bookingId ?? "all"],
    queryFn: () => fetchJson<Order[]>(`/api/orders${bookingId ? `?bookingId=${bookingId}` : ""}`),
    enabled: options?.enabled ?? true,
  });
}

/** Owner-only "deleted orders" log (Architecture Decision 79) — the server
 * rejects this for anyone but ACCOUNT_OWNER. */
export function useDeletedOrders(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["orders", "deleted"],
    queryFn: () => fetchJson<Order[]>("/api/orders?deletedOnly=true"),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OrderInput) =>
      fetchJson<Order>("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

/** Deletes an order, or requests its deletion (Architecture Decision 99)
 * — ACCOUNT_OWNER deletes immediately, anyone else's delete becomes a
 * pending request the owner approves or rejects (see
 * useApproveOrderDeletion/useRejectOrderDeletion). `reason` is always
 * required. */
export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      fetchJson<Order>(`/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

/** Owner approves a pending delete request, finalizing it into an actual
 * soft-delete (Architecture Decision 99). */
export function useApproveOrderDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => fetchJson<Order>(`/api/orders/${orderId}/approve-delete`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

/** Owner rejects a pending delete request — nothing is deleted, the
 * request is cleared (Architecture Decision 99). */
export function useRejectOrderDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => fetchJson<Order>(`/api/orders/${orderId}/reject-delete`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

/** Advances one station's fulfillment status on an order — the Kitchen
 * and Bar screens' status buttons. */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, station, status }: { orderId: string; station: MenuStation; status: IssueStatus }) =>
      fetchJson<Order>(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ station, status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}
