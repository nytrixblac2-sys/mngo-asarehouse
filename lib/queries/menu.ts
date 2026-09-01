import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { Currency, MenuItem, MenuStation } from "@/lib/types";

export interface MenuItemInput {
  name: string;
  category: string;
  price: number;
  currency: Currency;
  alwaysAvailable?: boolean;
  station?: MenuStation;
  imageUrl?: string | null;
  /** Only relevant to useUpdateMenuItem when the price actually changes —
   * see Architecture Decision 82. Ignored on create. */
  pin?: string;
}

export function useMenuItems() {
  return useQuery({
    queryKey: ["menu"],
    queryFn: () => fetchJson<MenuItem[]>("/api/menu"),
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MenuItemInput) =>
      fetchJson<MenuItem>("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MenuItemInput }) =>
      fetchJson<MenuItem>(`/api/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });
}

export function useToggleMenuItemAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailableToday }: { id: string; isAvailableToday: boolean }) =>
      fetchJson<MenuItem>(`/api/menu/${id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailableToday }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson<{ id: string }>(`/api/menu/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });
}
