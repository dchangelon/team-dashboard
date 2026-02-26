"use client";

import type { DashboardCard } from "@/lib/types";
import { BUCKETS, BUCKET_ORDER, BUCKET_COLORS, type BucketKey } from "@/lib/constants";
import { useFilterStore } from "@/stores/filter-store";
import { ChevronRight } from "lucide-react";

interface ProgressionTrackerProps {
  cards: DashboardCard[];
}

export function ProgressionTracker({ cards }: ProgressionTrackerProps) {
  const { status, setStatus } = useFilterStore();

  // Count cards per bucket
  const counts: Record<BucketKey, number> = {
    progress: 0,
    queue: 0,
    onHold: 0,
    completed: 0,
  };
  for (const card of cards) {
    const bucket = card.bucket as BucketKey;
    if (bucket in counts) {
      counts[bucket]++;
    }
  }

  // Count overdue per bucket
  const overdueCounts: Record<BucketKey, number> = {
    progress: 0,
    queue: 0,
    onHold: 0,
    completed: 0,
  };
  for (const card of cards) {
    if (card.isOverdue) {
      const bucket = card.bucket as BucketKey;
      if (bucket in overdueCounts) {
        overdueCounts[bucket]++;
      }
    }
  }

  return (
    <>
      {/* Desktop: horizontal progression tracker */}
      <div className="hidden sm:flex items-center rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
        {/* All button */}
        <button
          onClick={() => setStatus(null)}
          className={`flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium cursor-pointer transition-all duration-200 ${
            status === null
              ? "bg-blue-50 text-blue-700 shadow-sm"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          All
          <span className={`tabular-nums text-xs font-medium ${status === null ? "text-blue-700" : "text-gray-400"}`}>
            {cards.length}
          </span>
        </button>

        <div className="h-8 w-px bg-gray-200 mx-2" />

        {/* Bucket stages — fill remaining space equally */}
        <div className="flex flex-1 items-center">
          {BUCKET_ORDER.map((key, index) => {
            const bucket = BUCKETS[key];
            const colors = BUCKET_COLORS[key];
            const isActive = status === key;
            const count = counts[key];
            const overdueCount = overdueCounts[key];

            return (
              <div key={key} className="flex flex-1 items-center">
                {index > 0 && (
                  <ChevronRight className="h-5 w-5 text-gray-300 mx-1 shrink-0" />
                )}
                <button
                  onClick={() => setStatus(isActive ? null : key)}
                  className={`flex flex-1 items-center justify-center gap-2.5 rounded-lg px-4 py-3 text-sm cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className={`h-3 w-3 shrink-0 rounded-full ${colors.dot}`} />
                  <span className="whitespace-nowrap">{bucket.label}</span>
                  <span className={`tabular-nums text-xs font-medium ${isActive ? "text-blue-700" : "text-gray-400"}`}>
                    {count}
                  </span>
                  {overdueCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 px-1.5 py-0.5 text-[10px] font-medium">
                      {overdueCount}!
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: horizontal scrollable pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden">
        <button
          onClick={() => setStatus(null)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
            status === null
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          All
          <span className="tabular-nums opacity-70">{cards.length}</span>
        </button>
        {BUCKET_ORDER.map((key) => {
          const bucket = BUCKETS[key];
          const colors = BUCKET_COLORS[key];
          const isActive = status === key;
          const count = counts[key];

          return (
            <button
              key={key}
              onClick={() => setStatus(isActive ? null : key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                isActive
                  ? `${colors.badge} border-transparent`
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
              {bucket.label}
              <span className="tabular-nums text-gray-500">{count}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
