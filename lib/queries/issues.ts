import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { Issue, IssueStatus, IssueType } from "@/lib/types";

export interface IssueInput {
  propertyId: string;
  date: string;
  type: IssueType;
  description: string;
  guest?: string;
}

export function useIssues() {
  return useQuery({
    queryKey: ["issues"],
    queryFn: () => fetchJson<Issue[]>("/api/issues"),
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IssueInput) =>
      fetchJson<Issue>("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["issues"] }),
  });
}

/** Serves both "toggle Open <-> Resolved" and "set an explicit status" —
 * see app/api/issues/[id]/route.ts. `note` is optional free text on what
 * happened at this status change. */
export function useSetIssueStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: IssueStatus; note?: string }) =>
      fetchJson<Issue>(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["issues"] }),
  });
}
