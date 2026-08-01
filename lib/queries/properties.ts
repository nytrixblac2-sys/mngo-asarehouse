import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import { useEffectiveUser } from "@/components/effective-user-context";
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
 */
export function useProperties() {
  const { effectiveUser } = useEffectiveUser();
  const query = useQuery({
    queryKey: ["properties"],
    queryFn: () => fetchJson<Property[]>("/api/properties"),
  });

  if (!effectiveUser.propertyIds || !query.data) return query;
  const propertyIds = effectiveUser.propertyIds;
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
