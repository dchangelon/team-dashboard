"use client";

import type { DashboardCard } from "@/lib/types";
import { LABEL_COLORS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import {
  Calendar,
  AlertTriangle,
  CheckSquare,
  Square,
} from "lucide-react";

/**
 * Parses structured "Key: Value" descriptions into a readable format.
 * Falls back to plain text for lines that don't match the pattern.
 */
function FormattedDescription({ text }: { text: string }) {
  const lines = text.split("\n").filter((line) => line.trim());
  const keyValuePattern = /^([A-Za-z][A-Za-z /]+?):\s*(.+)$/;

  const parsed = lines.map((line) => {
    const match = line.trim().match(keyValuePattern);
    if (match) return { type: "field" as const, label: match[1], value: match[2] };
    return { type: "text" as const, value: line.trim() };
  });

  const hasFields = parsed.some((p) => p.type === "field");

  if (!hasFields) {
    return (
      <p className="whitespace-pre-wrap text-sm text-gray-500">{text}</p>
    );
  }

  return (
    <dl className="space-y-2 text-sm">
      {parsed.map((item, i) =>
        item.type === "field" ? (
          <div key={i}>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {item.label}
            </dt>
            <dd className="mt-0.5 text-gray-900">{item.value}</dd>
          </div>
        ) : (
          <p key={i} className="text-gray-500">{item.value}</p>
        ),
      )}
    </dl>
  );
}

interface CardModalProps {
  card: DashboardCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardModal({ card, open, onOpenChange }: CardModalProps) {
  if (!card) return null;

  const overallProgress =
    card.checklistTotal > 0
      ? Math.round((card.checklistCompleted / card.checklistTotal) * 100)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {overallProgress !== null && (
              <ProgressRing value={overallProgress} size={56} strokeWidth={5} />
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg leading-snug pr-6">
                {card.title}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Status + Labels row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {card.status}
          </span>
          {card.labels.map((label) => (
            <span
              key={label.name}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${LABEL_COLORS[label.color] ?? "bg-gray-100 text-gray-700"}`}
            >
              {label.name}
            </span>
          ))}
        </div>

        {/* Assignees */}
        {card.assignees.length > 0 && (
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">Assigned to: </span>
            {card.assignees.join(", ")}
          </div>
        )}

        {/* Due date */}
        {card.dueDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className={card.isOverdue ? "font-medium text-red-600" : ""}>
              {formatDate(card.dueDate)}
            </span>
            {card.isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2.5 py-0.5 text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </span>
            )}
          </div>
        )}

        {/* Overall progress */}
        {overallProgress !== null && (
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-gray-500">Overall Progress</span>
              <span className="font-medium">
                {card.checklistCompleted}/{card.checklistTotal} ({overallProgress}%)
              </span>
            </div>
            <ProgressBar
              value={overallProgress}
              completed={card.checklistCompleted}
              total={card.checklistTotal}
              size="md"
            />
          </div>
        )}

        {/* Checklists */}
        {card.checklists.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              {card.checklists.map((checklist) => (
                <div key={checklist.name}>
                  <h4 className="mb-2 text-sm font-medium">
                    {checklist.name}
                    <span className="ml-2 text-gray-500">
                      ({checklist.completed}/{checklist.total})
                    </span>
                  </h4>
                  <ul className="space-y-1">
                    {checklist.items.map((item) => (
                      <li
                        key={item.name}
                        className="flex items-start gap-2 text-sm"
                      >
                        {item.complete ? (
                          <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        ) : (
                          <Square className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        )}
                        <span
                          className={
                            item.complete
                              ? "text-gray-500 line-through"
                              : ""
                          }
                        >
                          {item.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Description */}
        {card.description && (
          <>
            <Separator />
            <div>
              <h4 className="mb-2 text-sm font-medium">Description</h4>
              <FormattedDescription text={card.description} />
            </div>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
