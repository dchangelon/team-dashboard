"use client";

import { useDashboardData, useRevalidate } from "@/hooks/use-dashboard-data";
import { formatRelativeTime } from "@/lib/utils";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Header() {
  const { data, isLoading } = useDashboardData();
  const revalidate = useRevalidate();

  function handleRefresh() {
    revalidate.mutate(undefined, {
      onSuccess: () => toast.success("Dashboard refreshed"),
      onError: () => toast.error("Failed to refresh dashboard"),
    });
  }

  const overdueCount = data?.summary.overdueCount ?? 0;

  return (
    <header className="border-b border-[#E0E0E4] bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-base font-semibold text-[#1A1A24] leading-tight">
            Data Analytics Projects
          </h1>
          {!isLoading && data?.summary.lastUpdated && (
            <p className="text-xs text-[#8A8A9B] mt-0.5">
              Updated {formatRelativeTime(data.summary.lastUpdated)}
            </p>
          )}
        </div>

        <button
          onClick={handleRefresh}
          disabled={revalidate.isPending || isLoading}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            "text-[#5B5B6E] hover:bg-gray-50 hover:text-[#1A1A24]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", revalidate.isPending && "animate-spin")}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {overdueCount > 0 && (
        <div className="border-t border-red-100 bg-red-50">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" />
            <p className="text-xs font-medium text-red-700">
              {overdueCount} {overdueCount === 1 ? "project is" : "projects are"} overdue
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
