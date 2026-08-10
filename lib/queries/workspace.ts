import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { WorkspaceType } from "@/lib/types";

export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  type: WorkspaceType;
  /** Whether the owner has set the action PIN (Architecture Decision 79)
   * — never the hash or plaintext itself, just presence. */
  hasPin: boolean;
}

/** `initialData` lets a caller that already has the server-fetched
 * workspace (the AppShell layout prop, threaded through TopBar/
 * TabsSidebar) seed the query so there's no loading flash before the
 * first client fetch resolves — same reasoning as useProperties'
 * initialData (lib/queries/properties.ts). Real incident, 2026-08-10:
 * on every refresh of a HOSTEL workspace, the nav briefly rendered the
 * RENTAL shape (getNavItems' default when workspace.type is still
 * unknown) before flipping to the correct one once this query resolved. */
export function useWorkspace(initialData?: WorkspaceInfo) {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: () => fetchJson<WorkspaceInfo>("/api/workspace"),
    initialData,
  });
}

/** Owner sets/changes the action PIN (Architecture Decision 79) —
 * ProfileModal's Security section. */
export function useSetWorkspacePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { newPin: string; currentPin?: string }) =>
      fetchJson<{ ok: true }>("/api/workspace/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace"] }),
  });
}

/** Checks a PIN without performing the gated action — see
 * app/api/workspace/verify-pin/route.ts. */
export function useVerifyWorkspacePin() {
  return useMutation({
    mutationFn: (pin: string) =>
      fetchJson<{ valid: boolean }>("/api/workspace/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      }),
  });
}
