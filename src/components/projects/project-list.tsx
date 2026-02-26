"use client";

import { useState } from "react";
import type { DashboardCard } from "@/lib/types";
import { BUCKETS, BUCKET_ORDER, BUCKET_COLORS, type BucketKey } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "./project-card";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ProjectListProps {
  cards: DashboardCard[];
  isLoading: boolean;
  onCardClick: (card: DashboardCard) => void;
}

// Default expanded state: active buckets open, others collapsed
const DEFAULT_EXPANDED: Record<BucketKey, boolean> = {
  progress: true,
  queue: true,
  onHold: false,
  completed: false,
};

function getBucketSummary(key: BucketKey, cards: DashboardCard[]): string | null {
  if (cards.length === 0) return null;
  const overdue = cards.filter((c) => c.isOverdue).length;
  if (key === "queue" && overdue > 0) return `${overdue} overdue`;
  if (key === "progress") {
    const inReview = cards.filter((c) => c.status === "Pending Review").length;
    if (inReview > 0) return `${inReview} in review`;
  }
  return null;
}

export function ProjectList({ cards, isLoading, onCardClick }: ProjectListProps) {
  const [expanded, setExpanded] = useState<Record<BucketKey, boolean>>(DEFAULT_EXPANDED);

  function toggleBucket(key: BucketKey) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (isLoading) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold">Projects</h2>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="mb-3 h-5 w-40" />
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  // Group cards by bucket
  const cardsByBucket = new Map<BucketKey, DashboardCard[]>();
  for (const key of BUCKET_ORDER) {
    cardsByBucket.set(key, []);
  }
  for (const card of cards) {
    const bucketCards = cardsByBucket.get(card.bucket as BucketKey);
    if (bucketCards) {
      bucketCards.push(card);
    }
  }

  // Sort cards within each bucket by last activity (most recent first)
  for (const [, bucketCards] of cardsByBucket) {
    bucketCards.sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Projects</h2>
      <div className="space-y-3">
        {BUCKET_ORDER.map((key) => {
          const bucket = BUCKETS[key];
          const bucketCards = cardsByBucket.get(key) ?? [];
          const isExpanded = expanded[key];
          const colors = BUCKET_COLORS[key];
          const summaryText = getBucketSummary(key, bucketCards);

          return (
            <div key={key} className="rounded-lg border bg-card">
              {/* Bucket header */}
              <button
                onClick={() => toggleBucket(key)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${colors.dot}`}
                />
                <span className="font-semibold">{bucket.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {bucketCards.length}
                </Badge>
                {summaryText && (
                  <span className="text-xs text-muted-foreground">
                    {summaryText}
                  </span>
                )}
              </button>

              {/* Bucket content */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  {bucketCards.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No projects
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {bucketCards.map((card) => (
                        <ProjectCard
                          key={card.id}
                          card={card}
                          onClick={() => onCardClick(card)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
