import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { WorkspaceUser } from "@/lib/users";

export function useWorkspaceUsers(enabled: boolean) {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => fetchJson<WorkspaceUser[]>("/api/users"),
    enabled,
  });
}

export interface InviteUserInput {
  name: string;
  email: string;
  role: "CO_MANAGER" | "PROPERTY_OWNER";
  propertyIds: string[];
}

export interface InviteUserResult {
  user: WorkspaceUser;
  temporaryPassword: string;
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteUserInput) =>
      fetchJson<InviteUserResult>("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useRemoveUserAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson<{ id: string }>(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
