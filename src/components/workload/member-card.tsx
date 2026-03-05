"use client";

import type { DashboardCard, TeamMemberWorkload } from "@/lib/types";
import { CAPACITY_THRESHOLDS } from "@/lib/constants";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberCardProps {
  workload: TeamMemberWorkload & {
    allCardsTotal?: number;
    allCardsOnHold?: number;
    allCardsInProgress?: number;
    allCardsInReview?: number;
  };
  onCardClick: (card: DashboardCard) => void;
}

function getCapacityColor(activeCount: number): string {
  if (activeCount > CAPACITY_THRESHOLDS.nearCapacity) return "#D4281C"; // high — red
  if (activeCount > CAPACITY_THRESHOLDS.available) return "#D9853B";   // moderate — amber
  return "#3FA557";                                                      // light — green
}

export function MemberCard({ workload }: MemberCardProps) {
  const isUnassigned = workload.memberId === "__unassigned__";

  // Use original (unfiltered) counts for the capacity bar so filters don't distort it
  const onHoldCards = workload.allCardsOnHold    ?? workload.cardsOnHold    ?? 0;
  const inProgCards = workload.allCardsInProgress ?? workload.cardsInProgress;
  const reviewCards = workload.allCardsInReview   ?? workload.cardsInReview;
  const activeCards = inProgCards + reviewCards; // progress bucket + review bucket

  // Bar fills relative to nearCapacity + 2 (so threshold = ~80% full)
  const barMax    = CAPACITY_THRESHOLDS.nearCapacity + 2;
  const rawActivePct = (activeCards  / barMax) * 100;
  const rawOnHoldPct = (onHoldCards  / barMax) * 100;
  const rawTotal     = rawActivePct + rawOnHoldPct;
  const scale        = rawTotal > 100 ? 100 / rawTotal : 1;
  const activePct    = Math.round(rawActivePct * scale);
  const onHoldPct    = Math.round(rawOnHoldPct * scale);

  const activeColor = isUnassigned ? "#8A8A9B" : getCapacityColor(activeCards);

  const initials = isUnassigned
    ? null
    : workload.memberName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          isUnassigned ? "bg-[#EBEBEF] text-[#8A8A9B]" : "bg-[#FDF3EC] text-[#E8762C]",
        )}
      >
        {isUnassigned ? <Inbox className="h-4 w-4" /> : initials}
      </div>

      {/* Name + segmented workload bar */}
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between leading-none">
          <span className="truncate text-sm font-medium text-[#1A1A24]">
            {workload.memberName}
          </span>
          {/* Count label — splits active / on-hold when both present */}
          <span className="ml-2 shrink-0 tabular-nums text-xs text-[#8A8A9B]">
            {isUnassigned ? (
              `${workload.cardsTotal} cards`
            ) : onHoldCards > 0 ? (
              <span>
                {activeCards} active
                <span className="text-[#D0D0D8]"> · </span>
                <span className="text-[#8A8A9B]">{onHoldCards} on hold</span>
              </span>
            ) : (
              `${activeCards} active`
            )}
          </span>
        </div>

        {/* Two-segment bar: active (capacity-colored) + on-hold (gray) */}
        {/* Unassigned: single neutral bar showing total backlog depth */}
        <div className="flex h-1.5 overflow-hidden rounded-full bg-[#EBEBEF]">
          {isUnassigned ? (
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (workload.cardsTotal / barMax) * 100)}%`,
                backgroundColor: "#8A8A9B",
                transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          ) : (
            <>
              {activePct > 0 && (
                <div
                  className="h-full"
                  style={{
                    width: `${activePct}%`,
                    backgroundColor: activeColor,
                    borderRadius: onHoldPct > 0 ? "9999px 0 0 9999px" : "9999px",
                    transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              )}
              {onHoldPct > 0 && (
                <div
                  className="h-full"
                  style={{
                    width: `${onHoldPct}%`,
                    backgroundColor: "#6B7280",
                    marginLeft: activePct > 0 ? "2px" : 0,
                    borderRadius: activePct > 0 ? "0 9999px 9999px 0" : "9999px",
                    transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Overdue indicator */}
      {workload.overdueCards > 0 && (
        <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-red-600">
          <AlertTriangle className="h-3 w-3" />
          {workload.overdueCards}
        </span>
      )}
    </div>
  );
}
