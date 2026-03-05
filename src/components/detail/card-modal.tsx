"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import type { DashboardCard } from "@/lib/types";
import { BUCKET_COLORS, LABEL_COLORS, type BucketKey } from "@/lib/constants";
import { formatDate, formatRelativeTime, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, AlertTriangle } from "lucide-react";

interface CardModalProps {
  card: DashboardCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardModal({ card, open, onOpenChange }: CardModalProps) {
  if (!card) return null;

  const bucketColors = BUCKET_COLORS[card.bucket as BucketKey];
  const overallProgress =
    card.checklistTotal > 0
      ? Math.round((card.checklistCompleted / card.checklistTotal) * 100)
      : null;

  const toInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const hasDueOrActivity = card.dueDate || card.lastActivity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-lg overflow-y-auto border-t-4"
        style={{ borderTopColor: bucketColors?.hex ?? "#E0E0E4" }}
      >
        <div className="space-y-5">
          {/* Title + status badge + label pills */}
          <div>
            <DialogTitle className="mb-2 pr-8 text-xl font-semibold leading-snug text-[#1A1A24]">
              {card.title}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  bucketColors?.badge ?? "bg-[#EBEBEF] text-[#5B5B6E]",
                )}
              >
                {card.status}
              </span>
              {card.labels.map((label) => (
                <span
                  key={label.name}
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    LABEL_COLORS[label.color] ?? "bg-[#EBEBEF] text-[#5B5B6E]",
                  )}
                >
                  {label.name}
                </span>
              ))}
            </div>
          </div>

          {/* Meta row: assignees · due date · last activity */}
          {(card.assignees.length > 0 || hasDueOrActivity) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#8A8A9B]">
              {card.assignees.length > 0 && (
                <div className="flex items-center gap-1">
                  {card.assignees.slice(0, 3).map((name) => (
                    <span
                      key={name}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FDF3EC] text-[10px] font-semibold text-[#E8762C]"
                    >
                      {toInitials(name)}
                    </span>
                  ))}
                  {card.assignees.length > 3 && (
                    <span className="ml-0.5">+{card.assignees.length - 3}</span>
                  )}
                </div>
              )}

              {card.assignees.length > 0 && hasDueOrActivity && (
                <span className="text-[#D0D0D8]">·</span>
              )}

              {card.dueDate && (
                <span
                  className={cn(
                    "flex items-center gap-1",
                    card.isOverdue && "font-medium text-red-600",
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(card.dueDate)}
                  {card.isOverdue && <AlertTriangle className="h-3 w-3" />}
                </span>
              )}

              {card.dueDate && card.lastActivity && (
                <span className="text-[#D0D0D8]">·</span>
              )}

              {card.lastActivity && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatRelativeTime(card.lastActivity)}
                </span>
              )}
            </div>
          )}

          {/* Overall progress bar */}
          {overallProgress !== null && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8A9B]">
                  Progress
                </span>
                <span className="tabular-nums text-xs font-medium text-[#5B5B6E]">
                  {card.checklistCompleted} / {card.checklistTotal} · {overallProgress}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#EBEBEF]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${overallProgress}%`,
                    backgroundColor: bucketColors?.hex ?? "#E0E0E4",
                  }}
                />
              </div>
            </div>
          )}

          {/* Checklists */}
          {card.checklists.length > 0 && (
            <div className="space-y-4 border-t border-[#EBEBEF] pt-4">
              {card.checklists.map((checklist) => (
                <div key={checklist.name}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8A9B]">
                      {checklist.name}
                    </span>
                    <span className="tabular-nums text-xs text-[#8A8A9B]">
                      {checklist.completed}/{checklist.total}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {checklist.items.map((item) => (
                      <li key={item.name} className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            "mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-[1.5px]",
                            item.complete
                              ? "border-[#3FA557] bg-[#3FA557]"
                              : "border-[#D0D0D8]",
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm leading-snug",
                            item.complete ? "text-[#ABABBB]" : "text-[#1A1A24]",
                          )}
                        >
                          {item.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {card.description && (
            <div className="border-t border-[#EBEBEF] pt-4">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-[#8A8A9B]">
                Description
              </span>
              <div className="space-y-2 text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkBreaks]}
                  components={{
                    p:      ({ children }) => <p className="text-[#5B5B6E]">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-[#1A1A24]">{children}</strong>,
                    em:     ({ children }) => <em className="italic text-[#5B5B6E]">{children}</em>,
                    h1:     ({ children }) => <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8A9B]">{children}</p>,
                    h2:     ({ children }) => <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8A9B]">{children}</p>,
                    h3:     ({ children }) => <p className="text-xs font-semibold uppercase tracking-wider text-[#8A8A9B]">{children}</p>,
                    ul:     ({ children }) => <ul className="ml-3 space-y-1">{children}</ul>,
                    ol:     ({ children }) => <ol className="ml-3 list-decimal space-y-1">{children}</ol>,
                    li:     ({ children }) => <li className="flex items-start gap-2 text-[#5B5B6E]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D0D0D8]" /><span>{children}</span></li>,
                    a:      ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#E8762C] underline underline-offset-2">{children}</a>,
                    code:   ({ children }) => <code className="rounded bg-[#EBEBEF] px-1 py-0.5 font-mono text-xs text-[#5B5B6E]">{children}</code>,
                    hr:     () => <hr className="border-[#EBEBEF]" />,
                  }}
                >
                  {card.description}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
