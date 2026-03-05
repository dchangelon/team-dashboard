"use client";

import type { DashboardCard } from "@/lib/types";
import { BUCKET_COLORS, LABEL_COLORS, STALENESS_THRESHOLDS, type BucketKey } from "@/lib/constants";
import { getDaysSinceActivity, cn } from "@/lib/utils";
import { AlertTriangle, Clock } from "lucide-react";

interface ProjectCardProps {
  card: DashboardCard;
  onClick: () => void;
}

export function ProjectCard({ card, onClick }: ProjectCardProps) {
  const bucketColors = BUCKET_COLORS[card.bucket as BucketKey];
  const daysSinceActivity = getDaysSinceActivity(card.lastActivity);
  const showStaleness =
    !card.isComplete && !card.isOverdue && daysSinceActivity >= STALENESS_THRESHOLDS.stale;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  const toInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const firstInitials  = card.assignees.length > 0 ? toInitials(card.assignees[0]) : null;
  const secondInitials = card.assignees.length > 1 ? toInitials(card.assignees[1]) : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative isolate overflow-hidden flex cursor-pointer rounded-lg border border-[#E0E0E4] border-l-[3px] bg-white px-3 py-2",
        "transition-colors duration-150 hover:bg-[#FAFAFA]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8762C]/50",
        bucketColors?.border ?? "border-l-[#D0D0D8]",
        card.isOverdue && "ring-1 ring-red-200",
      )}
    >
      {/* Layer 1: atmospheric fill */}
      {card.checklistTotal > 0 && card.checklistProgress > 0 && (
        <div
          className="absolute inset-y-0 left-0 pointer-events-none"
          style={{
            width: `${card.checklistProgress}%`,
            backgroundColor: bucketColors?.hex ?? "#E0E0E4",
            opacity: 0.12,
            zIndex: 0,
          }}
        />
      )}

      {/* Layer 2: sharp bottom bar — precise progress edge */}
      {card.checklistTotal > 0 && card.checklistProgress > 0 && (
        <div
          className="absolute bottom-0 left-0 h-0.5 pointer-events-none rounded-bl-lg"
          style={{
            width: `${card.checklistProgress}%`,
            backgroundColor: bucketColors?.hex ?? "#E0E0E4",
            zIndex: 0,
          }}
        />
      )}

      {/* Content layer — sits above the absolute progress fill */}
      <div className="relative flex flex-1 items-center gap-2.5 min-w-0" style={{ zIndex: 1 }}>
        {/* Project name */}
        <span className="flex-1 truncate text-sm font-medium text-[#1A1A24]">
          {card.title}
        </span>

        {/* Label pills — up to 3, fill whitespace between title and right columns */}
        {card.labels.slice(0, 3).map((label) => (
          <span
            key={label.name}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-1.5 py-0 text-[10px] font-medium",
              LABEL_COLORS[label.color] ?? "bg-[#EBEBEF] text-[#5B5B6E]",
            )}
          >
            {label.name}
          </span>
        ))}

        {/* Assignee slot — fixed w-14, side-by-side avatar chips (up to 2 visible) */}
        <div className="w-14 shrink-0 flex items-center justify-end gap-0.5">
          {firstInitials && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FDF3EC] text-[10px] font-semibold text-[#E8762C]">
              {firstInitials}
            </span>
          )}
          {secondInitials && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FDF3EC] text-[10px] font-semibold text-[#E8762C]">
              {secondInitials}
            </span>
          )}
          {card.assignees.length > 2 && (
            <span className="ml-0.5 text-[10px] text-[#8A8A9B]">+{card.assignees.length - 2}</span>
          )}
        </div>

        {/* Fraction slot — fixed w-8, right-aligned */}
        <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-[#8A8A9B]">
          {card.checklistTotal > 0 ? `${card.checklistCompleted}/${card.checklistTotal}` : ""}
        </span>

        {/* Status icon slot — fixed w-4, centered */}
        <span className="w-4 shrink-0 flex items-center justify-center">
          {card.isOverdue && <AlertTriangle className="h-3 w-3 text-red-600" />}
          {showStaleness && !card.isOverdue && (
            <Clock
              className={cn(
                "h-3 w-3",
                daysSinceActivity >= STALENESS_THRESHOLDS.stuck
                  ? "text-red-600"
                  : "text-amber-500",
              )}
            />
          )}
        </span>
      </div>
    </div>
  );
}
