import { getProgressColor } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProgressBarProps {
  value: number; // 0-100
  completed?: number;
  total?: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  completed,
  total,
  size = "sm",
  showLabel = false,
  className = "",
}: ProgressBarProps) {
  const height = size === "sm" ? "h-2.5" : "h-3";
  const colorClass = getProgressColor(value);

  const tooltipText =
    completed != null && total != null
      ? `${completed} of ${total} complete (${value}%)`
      : `${value}%`;

  const bar = (
    <div
      className={`w-full rounded-full bg-gray-200 ${height} ${className}`}
    >
      <div
        className={`${height} rounded-full transition-all duration-500 ease-out ${colorClass}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );

  if (showLabel) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{bar}</TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return bar;
}
