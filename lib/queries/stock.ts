import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { MenuItem, StockAdjustment } from "@/lib/types";

/** Every stock adjustment in the workspace — the Shop admin screen's
 * Inventory tab, STORE-only (RENTAL/HOSTEL items are never tracked, so
 * this is always empty for them). */
export function useStockAdjustments(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["stock-adjustments"],
    queryFn: () => fetchJson<StockAdjustment[]>("/api/stock-adjustments"),
    enabled: options?.enabled ?? true,
  });
}

/** Records a restock/correction against one item and returns its updated
 * stockQuantity — also how tracking gets turned on for the first time
 * (see app/api/menu/[id]/stock-adjustments's doc comment). Invalidates
 * both `menu` (the item's new quantity) and `stock-adjustments` (the new
 * history row). */
export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, delta, reason }: { id: string; delta: number; reason: string }) =>
      fetchJson<MenuItem>(`/api/menu/${id}/stock-adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta, reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments"] });
    },
  });
}
