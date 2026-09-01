import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { ShopOrder } from "@/lib/types";

export function useShopOrders() {
  return useQuery({
    queryKey: ["shop-orders"],
    queryFn: () => fetchJson<ShopOrder[]>("/api/shop-orders"),
  });
}

export function useUpdateShopOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" }) =>
      fetchJson<ShopOrder>(`/api/shop-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shop-orders"] }),
  });
}

export function useToggleShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hasShop: boolean) =>
      fetchJson<{ hasShop: boolean }>("/api/workspace/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasShop }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace"] }),
  });
}
