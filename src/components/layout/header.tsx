"use client";

import { useDashboardData, useRevalidate } from "@/hooks/use-dashboard-data";
import { formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertTriangle } from "lucide-react";
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
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-500">
            <span className="text-sm font-bold text-white">D</span>
          </div>
          <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Data Analytics Projects
          </h1>
          <p className="text-sm text-gray-500">
            {isLoading ? (
              <Skeleton className="mt-1 h-4 w-32" />
            ) : data?.summary.lastUpdated ? (
              `Updated ${formatRelativeTime(data.summary.lastUpdated)}`
            ) : (
              "Loading..."
            )}
          </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={revalidate.isPending || isLoading}
        >
          <RefreshCw
            className={`mr-1.5 h-4 w-4 ${revalidate.isPending ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Overdue alert banner */}
      {overdueCount > 0 && (
        <div className="border-t border-red-200 bg-red-50">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <p className="text-sm font-medium text-red-800">
              {overdueCount} {overdueCount === 1 ? "project is" : "projects are"} overdue
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
