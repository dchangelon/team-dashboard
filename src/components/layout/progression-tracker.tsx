"use client";

import type { DashboardCard } from "@/lib/types";
import { BUCKETS, BUCKET_ORDER, HEALTH_THRESHOLDS, type BucketKey } from "@/lib/constants";
import { useFilterStore } from "@/stores/filter-store";
import { cn } from "@/lib/utils";

interface ProgressionTrackerProps {
  cards: DashboardCard[];
}

const STAGE_COLORS: Record<BucketKey, { bar: string; muted: boolean }> = {
  queue:     { bar: "#6366F1", muted: false },
  progress:  { bar: "#E8762C", muted: false },
  review:    { bar: "#14B8A6", muted: false },
  onHold:    { bar: "#6B7280", muted: true  },
  completed: { bar: "#3FA557", muted: false },
};

export function ProgressionTracker({ cards }: ProgressionTrackerProps) {
  const { status, setStatus } = useFilterStore();

  const counts = { queue: 0, progress: 0, review: 0, onHold: 0, completed: 0 } as Record<BucketKey, number>;
  const overdueCounts = { queue: 0, progress: 0, review: 0, onHold: 0, completed: 0 } as Record<BucketKey, number>;

  for (const card of cards) {
    const bucket = card.bucket as BucketKey;
    if (bucket in counts) counts[bucket]++;
    if (card.isOverdue && bucket in overdueCounts) overdueCounts[bucket]++;
  }

  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div className="overflow-hidden rounded-xl border border-[#E0E0E4] bg-white shadow-sm">
      {/* "All" toggle header */}
      <div className="flex items-center gap-3 border-b border-[#EBEBEF] px-4 py-2.5">
        <button
          onClick={() => setStatus(null)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            status === null
              ? "bg-[#E8762C] text-white"
              : "text-[#5B5B6E] hover:bg-gray-100",
          )}
        >
          All
        </button>
        <span className="text-xs text-[#8A8A9B]">{cards.length} projects</span>
      </div>

      {/* Stage columns — 5 stages */}
      <div className="hidden sm:grid sm:grid-cols-5">
        {BUCKET_ORDER.map((key, index) => {
          const bucket = BUCKETS[key];
          const count = counts[key];
          const overdueCount = overdueCounts[key];
          const isActive = status === key;
          const colors = STAGE_COLORS[key];
          const barPct = (count / maxCount) * 100;
          const queueHealthColor = key === "queue" && !isActive
            ? count > HEALTH_THRESHOLDS.queueDepth.yellow ? "#D4281C"
            : count > HEALTH_THRESHOLDS.queueDepth.green  ? "#D9853B"
            : null
            : null;

          return (
            <button
              key={key}
              onClick={() => setStatus(isActive ? null : key)}
              className={cn(
                "flex cursor-pointer flex-col p-4 text-left transition-colors hover:bg-gray-50",
                index < BUCKET_ORDER.length - 1 && "border-r border-[#EBEBEF]",
                isActive && "bg-[#FDF3EC]",
              )}
            >
              {/* Label + overdue */}
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-medium",
                    colors.muted ? "text-[#8A8A9B]" : "text-[#5B5B6E]",
                    isActive && "text-[#E8762C]",
                  )}
                >
                  {bucket.label}
                </span>
                {overdueCount > 0 && (
                  <span className="text-[10px] font-bold leading-none text-red-600">
                    {overdueCount} overdue
                  </span>
                )}
              </div>

              {/* Count */}
              <div
                className={cn(
                  "mb-3 text-3xl font-bold leading-none tabular-nums",
                  isActive
                    ? "text-[#E8762C]"
                    : colors.muted
                      ? "text-[#8A8A9B]"
                      : "text-[#1A1A24]",
                )}
                style={queueHealthColor ? { color: queueHealthColor } : undefined}
              >
                {count}
              </div>

              {/* Proportional bar */}
              <div className="mt-auto h-1.5 overflow-hidden rounded-full bg-[#EBEBEF]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${barPct}%`,
                    backgroundColor: isActive ? "#E8762C" : colors.bar,
                    transition: "width 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile: horizontal scrollable pills */}
      <div className="flex gap-2 overflow-x-auto p-3 sm:hidden border-t border-[#EBEBEF]">
        <button
          onClick={() => setStatus(null)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            status === null
              ? "border-[#E8762C] bg-[#E8762C] text-white"
              : "border-[#E0E0E4] text-[#5B5B6E] hover:bg-gray-50",
          )}
        >
          All
          <span className="tabular-nums opacity-70">{cards.length}</span>
        </button>
        {BUCKET_ORDER.map((key) => {
          const bucket = BUCKETS[key];
          const isActive = status === key;
          const count = counts[key];
          const colors = STAGE_COLORS[key];

          return (
            <button
              key={key}
              onClick={() => setStatus(isActive ? null : key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "border-[#E8762C] bg-[#E8762C] text-white"
                  : "border-[#E0E0E4] text-[#5B5B6E] hover:bg-gray-50",
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: isActive ? "white" : colors.bar }}
              />
              {bucket.label}
              <span className="tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
