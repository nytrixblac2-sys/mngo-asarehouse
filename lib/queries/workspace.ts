import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";

export interface WorkspaceInfo {
  id: string;
  name: string;
}

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: () => fetchJson<WorkspaceInfo>("/api/workspace"),
  });
}
