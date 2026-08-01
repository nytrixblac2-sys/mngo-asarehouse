import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import { useEffectiveUserOptional } from "@/components/effective-user-context";
import type { Allocation, Currency, Property } from "@/lib/types";

export interface CreatePropertyInput {
  name: string;
}

export interface UpdatePropertyInput {
  color: string;
  currencies: Currency[];
  allocation: Partial<Record<Currency, Allocation>>;
  rooms: string[];
  facilities: string[];
}

/**
 * The API always scopes properties to the real signed-in user (a manager
 * sees every workspace property). During owner preview, the real user is
 * still a manager server-side, so the raw response needs a client-side
 * cut down to what the previewed owner can actually see — same scope
 * lib/properties.ts getVisibleProperties would apply to their real
 * session. effectiveUser.propertyIds is only ever set on a preview target
 * (store/use-app-store.ts), so this is a no-op outside preview.
 *
 * Uses useEffectiveUserOptional rather than the throwing version because
 * this hook is also called from AppShell chrome (TopBar/TabsSidebar via
 * PropertySwitcher/ProfileModal) that sits outside EffectiveUserProvider
 * — see components/app-shell.tsx. `initialData` lets a caller that
 * already has a server-fetched properties list (the AppShell layout prop)
 * seed the query so there's no loading flash before the first client
 * fetch resolves — user feedback, 2026-08: the property switcher wasn't
 * reflecting newly-created/edited/deleted properties without a full page
 * reload, because it was reading only that static server-provided prop
 * instead of this reactive, cache-invalidated query.
 */
export function useProperties(initialData?: Property[]) {
  const effective = useEffectiveUserOptional();
  const query = useQuery({
    queryKey: ["properties"],
    queryFn: () => fetchJson<Property[]>("/api/properties"),
    initialData,
  });

  const propertyIds = effective?.effectiveUser.propertyIds;
  if (!propertyIds || !query.data) return query;
  return { ...query, data: query.data.filter((p) => propertyIds.includes(p.id)) };
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePropertyInput) =>
      fetchJson<Property>("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePropertyInput }) =>
      fetchJson<Property>(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["properties"] }),
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson<{ id: string }>(`/api/properties/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["properties"] }),
  });
}
