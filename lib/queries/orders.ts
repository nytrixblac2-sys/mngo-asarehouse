import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { Order } from "@/lib/types";

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
