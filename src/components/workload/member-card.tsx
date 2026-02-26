"use client";

import { useState } from "react";
import type { DashboardCard, TeamMemberWorkload } from "@/lib/types";
import { CAPACITY_THRESHOLDS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ProjectCard } from "@/components/projects/project-card";
import { AlertTriangle, ChevronDown, ChevronUp, Inbox } from "lucide-react";

interface MemberCardProps {
  workload: TeamMemberWorkload & { allCardsTotal?: number };
  onCardClick: (card: DashboardCard) => void;
}

function getCapacityDot(activeCards: number) {
  if (activeCards > CAPACITY_THRESHOLDS.nearCapacity) return "bg-red-500";
  if (activeCards > CAPACITY_THRESHOLDS.available) return "bg-amber-500";
  return "bg-green-500";
}

function getCapacityLabel(count: number): string {
  if (count > CAPACITY_THRESHOLDS.nearCapacity) return `${count} active cards \u2014 high load`;
  if (count > CAPACITY_THRESHOLDS.available) return `${count} active cards \u2014 moderate load`;
  return `${count} active cards \u2014 light load`;
}

export function MemberCard({ workload, onCardClick }: MemberCardProps) {
  const [expanded, setExpanded] = useState(false);

  const showExpandToggle = workload.cards.length > 4;
  const visibleCards = expanded ? workload.cards : workload.cards.slice(0, 4);
  const isUnassigned = workload.memberId === "__unassigned__";
  const capacityTotal = workload.allCardsTotal ?? workload.cardsTotal;
  const capacityDot = isUnassigned ? "bg-gray-400" : getCapacityDot(capacityTotal);

  return (
    <Card className="overflow-hidden pt-0 gap-0 bg-white border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-700">
          {isUnassigned ? <Inbox className="h-4 w-4" /> : workload.memberName.charAt(0)}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold leading-tight text-sm text-gray-900">{workload.memberName}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`h-2 w-2 rounded-full ${capacityDot}`} />
            <p className="text-[11px] text-gray-500">
              {isUnassigned ? `${workload.cardsTotal} cards` : getCapacityLabel(capacityTotal)}
            </p>
          </div>
        </div>
        {workload.overdueCards > 0 && (
          <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-xs font-medium">
            <AlertTriangle className="h-3 w-3" />
            {workload.overdueCards} overdue
          </span>
        )}
      </div>

      <CardContent className="space-y-2 px-4 pt-3 pb-3">
        {/* Stat pills */}
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-[11px] font-medium">
            {workload.cardsTotal} active
          </span>
          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[11px] font-medium">
            {workload.cardsInProgress} in progress
          </span>
          <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-medium">
            {workload.cardsInReview} in review
          </span>
          {(workload.cardsOnHold ?? 0) > 0 && (
            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-[11px] font-medium">
              {workload.cardsOnHold} on hold
            </span>
          )}
          {(workload.cardsCompleted ?? 0) > 0 && (
            <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[11px] font-medium">
              {workload.cardsCompleted} completed
            </span>
          )}
        </div>

        {/* Average progress */}
        {workload.cardsTotal > 0 && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>Avg. progress</span>
              <span>{workload.averageProgress}%</span>
            </div>
            <ProgressBar value={workload.averageProgress} size="sm" />
          </div>
        )}

        {/* Card list */}
        {workload.cards.length === 0 ? (
          <p className="py-2 text-center text-sm text-gray-500">
            No active projects assigned
          </p>
        ) : (
          <div className="space-y-2">
            {visibleCards.map((card) => (
              <ProjectCard
                key={card.id}
                card={card}
                onClick={() => onCardClick(card)}
              />
            ))}

            {showExpandToggle && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="mr-1 h-4 w-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-4 w-4" />
                    Show all {workload.cards.length} projects
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
