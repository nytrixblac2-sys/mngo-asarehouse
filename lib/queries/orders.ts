import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { IssueStatus, Order } from "@/lib/types";

export interface OrderInput {
  bookingId: string;
  items: { menuItemId: string; quantity: number }[];
}

/** Pass a bookingId to scope to one guest's stay (booking detail view);
 * omit for every order in the workspace. `enabled` lets a RENTAL-workspace
 * caller skip the request entirely rather than fetching data it'll never use. */
export function useOrders(bookingId?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["orders", bookingId ?? "all"],
    queryFn: () => fetchJson<Order[]>(`/api/orders${bookingId ? `?bookingId=${bookingId}` : ""}`),
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

/** Advances one station's fulfillment status on an order — the Kitchen
 * and Bar screens' status buttons. */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, station, status }: { orderId: string; station: "KITCHEN" | "BAR"; status: IssueStatus }) =>
      fetchJson<Order>(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ station, status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}
