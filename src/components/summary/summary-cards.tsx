"use client";

import type { BoardSummary } from "@/lib/types";
import { HEALTH_THRESHOLDS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Inbox, Loader, CheckCircle, PauseCircle, Info, type LucideIcon } from "lucide-react";

interface SummaryCardsProps {
  summary: BoardSummary | undefined;
  isLoading: boolean;
}

interface MetricConfig {
  label: string;
  key: keyof Pick<BoardSummary, "queueDepth" | "inProgress" | "recentlyCompleted" | "onHold">;
  icon: LucideIcon;
  getColor: (value: number) => string;
  getSubMetric?: (summary: BoardSummary) => string | null;
  legendTooltip?: string;
}

function thresholdColor(
  value: number,
  thresholds: { green: number; yellow: number },
): string {
  if (value > thresholds.yellow) return "red";
  if (value > thresholds.green) return "yellow";
  return "green";
}

const COLOR_MAP: Record<string, { text: string; border: string }> = {
  red: { text: "text-red-600", border: "border-l-red-500" },
  yellow: { text: "text-amber-600", border: "border-l-amber-500" },
  green: { text: "text-green-600", border: "border-l-green-500" },
  blue: { text: "text-blue-600", border: "border-l-blue-500" },
};

const METRICS: MetricConfig[] = [
  {
    label: "Queue Depth",
    key: "queueDepth",
    icon: Inbox,
    getColor: (v) => thresholdColor(v, HEALTH_THRESHOLDS.queueDepth),
    getSubMetric: (s) =>
      s.overdueCount > 0 ? `${s.overdueCount} overdue` : null,
    legendTooltip: "Green: 5 or fewer · Yellow: 6-10 · Red: more than 10",
  },
  {
    label: "In Progress",
    key: "inProgress",
    icon: Loader,
    getColor: () => "blue",
  },
  {
    label: "Completed (30d)",
    key: "recentlyCompleted",
    icon: CheckCircle,
    getColor: () => "green",
  },
  {
    label: "On Hold",
    key: "onHold",
    icon: PauseCircle,
    getColor: (v) => thresholdColor(v, HEALTH_THRESHOLDS.onHold),
    legendTooltip: "Green: 1 or fewer · Yellow: 2-3 · Red: more than 3",
  },
];

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {METRICS.map((metric) => {
          const value = summary?.[metric.key] ?? 0;
          const Icon = metric.icon;
          const colorKey = metric.getColor(value);
          const colors = COLOR_MAP[colorKey];
          const subMetric = summary && metric.getSubMetric?.(summary);

          return (
            <Card
              key={metric.key}
              className={`h-[100px] border-l-4 py-0 bg-white ${colors.border}`}
            >
              <CardContent className="flex h-full items-center gap-3 p-4">
                <div className="rounded-lg bg-gray-100 p-2.5 text-gray-500">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-gray-500">{metric.label}</p>
                    {metric.legendTooltip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">{metric.legendTooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
                  {subMetric && (
                    <p className="text-xs text-gray-500">{subMetric}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
