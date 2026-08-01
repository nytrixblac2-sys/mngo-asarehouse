import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api-client";
import type { Currency, ManualIncome } from "@/lib/types";

export interface ManualIncomeInput {
  propertyId: string;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
}

export function useManualIncome() {
  return useQuery({
    queryKey: ["manual-income"],
    queryFn: () => fetchJson<ManualIncome[]>("/api/manual-income"),
  });
}

export function useCreateManualIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ManualIncomeInput) =>
      fetchJson<ManualIncome>("/api/manual-income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["manual-income"] }),
  });
}
