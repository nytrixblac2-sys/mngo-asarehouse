import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { IssueStatus, Schedule, ScheduleType } from "@/lib/types";

export interface ScheduleInput {
  propertyId: string;
  type: ScheduleType;
  date: string;
  assignedTo: string;
  note?: string;
}

export function useSchedules() {
  return useQuery({
    queryKey: ["schedules"],
    queryFn: () => fetchJson<Schedule[]>("/api/schedules"),
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScheduleInput) =>
      fetchJson<Schedule>("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules"] }),
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ScheduleInput }) =>
      fetchJson<Schedule>(`/api/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules"] }),
  });
}

/** Mirrors useSetIssueStatus — see app/api/schedules/[id]/status/route.ts. */
export function useSetScheduleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: IssueStatus; note?: string }) =>
      fetchJson<Schedule>(`/api/schedules/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules"] }),
  });
}
