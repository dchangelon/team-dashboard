"use client";

import type { DashboardCard } from "@/lib/types";
import { LABEL_COLORS, BUCKET_COLORS, type BucketKey } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Calendar, AlertTriangle } from "lucide-react";

interface ProjectCardProps {
  card: DashboardCard;
  onClick: () => void;
}

export function ProjectCard({ card, onClick }: ProjectCardProps) {
  const bucketColors = BUCKET_COLORS[card.bucket as BucketKey];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  const progressText =
    card.checklistTotal > 0
      ? `${card.checklistCompleted}/${card.checklistTotal}`
      : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`cursor-pointer rounded-lg border border-gray-200 border-l-[3px] bg-white px-3 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        bucketColors?.border ?? "border-l-gray-300"
      } ${card.isOverdue ? "ring-1 ring-red-200" : ""}`}
    >
      {/* Row 1: title + status badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-gray-900">{card.title}</h3>
        <span
          className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${bucketColors?.badge ?? "bg-gray-100 text-gray-600"}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${bucketColors?.dot ?? "bg-gray-400"}`}
          />
          {card.status}
        </span>
      </div>

      {/* Row 2: progress bar + meta inline */}
      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar
            value={card.checklistProgress}
            completed={card.checklistCompleted}
            total={card.checklistTotal}
            size="sm"
          />
        </div>
        {progressText && (
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-gray-500">
            {progressText}
          </span>
        )}
        {card.dueDate && (
          <>
            <span className="text-gray-300 text-[10px]">&middot;</span>
            <span
              className={`flex shrink-0 items-center gap-0.5 text-[11px] ${card.isOverdue ? "font-semibold text-red-600" : "text-gray-500"}`}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(card.dueDate)}
              {card.isOverdue && <AlertTriangle className="h-3 w-3" />}
            </span>
          </>
        )}
      </div>

      {/* Row 3: labels (only if present) */}
      {card.labels.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <span
              key={label.name}
              className={`inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium ${LABEL_COLORS[label.color] ?? "bg-gray-100 text-gray-700"}`}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
