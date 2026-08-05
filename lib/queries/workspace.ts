import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { WorkspaceType } from "@/lib/types";

export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  type: WorkspaceType;
}

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: () => fetchJson<WorkspaceInfo>("/api/workspace"),
  });
}
