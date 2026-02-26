import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { DashboardData } from "@/lib/types";
import { TANSTACK_STALE_TIME_MS } from "@/lib/constants";

async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard-data");
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.error ?? `Failed to fetch dashboard data (${response.status})`,
    );
  }
  return response.json();
}

export function useDashboardData(
  options?: Omit<
    UseQueryOptions<DashboardData, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: ["dashboard-data"],
    queryFn: fetchDashboardData,
    staleTime: TANSTACK_STALE_TIME_MS,
    retry: 1,
    ...options,
  });
}

export function useRevalidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/revalidate", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to revalidate cache");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    },
  });
}
