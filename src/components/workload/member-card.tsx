"use client";

import { useState } from "react";
import type { DashboardCard, TeamMemberWorkload } from "@/lib/types";
import { CAPACITY_THRESHOLDS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProjectCard } from "@/components/projects/project-card";
import { AlertTriangle, ChevronDown, ChevronUp, Inbox } from "lucide-react";

interface MemberCardProps {
  workload: TeamMemberWorkload & { allCardsTotal?: number };
  onCardClick: (card: DashboardCard) => void;
}

function getCapacityStyle(activeCards: number) {
  if (activeCards > CAPACITY_THRESHOLDS.nearCapacity)
    return { border: "border-l-red-500", badge: "bg-red-50 text-red-700", label: "High load" };
  if (activeCards > CAPACITY_THRESHOLDS.available)
    return { border: "border-l-amber-500", badge: "bg-amber-50 text-amber-700", label: "Moderate" };
  return { border: "border-l-green-500", badge: "bg-green-50 text-green-700", label: "Light" };
}

export function MemberCard({ workload, onCardClick }: MemberCardProps) {
  const [expanded, setExpanded] = useState(false);

  const showExpandToggle = workload.cards.length > 4;
  const visibleCards = expanded ? workload.cards : workload.cards.slice(0, 4);
  const isUnassigned = workload.memberId === "__unassigned__";
  const capacityTotal = workload.allCardsTotal ?? workload.cardsTotal;
  const capacity = isUnassigned
    ? { border: "border-l-gray-400", badge: "bg-gray-100 text-gray-600", label: `${workload.cardsTotal} cards` }
    : getCapacityStyle(capacityTotal);

  return (
    <Card className={`overflow-hidden pt-0 gap-0 bg-white border border-gray-200 shadow-sm border-l-4 ${capacity.border}`}>
      {/* Header: ProgressRing + name + capacity badge */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        {isUnassigned ? (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <Inbox className="h-5 w-5" />
          </span>
        ) : (
          <ProgressRing value={workload.averageProgress} size={48} strokeWidth={4} />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold leading-tight text-sm text-gray-900">{workload.memberName}</h3>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${capacity.badge}`}>
            {capacity.label}
          </span>
        </div>
        {workload.overdueCards > 0 && (
          <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-xs font-medium">
            <AlertTriangle className="h-3 w-3" />
            {workload.overdueCards} overdue
          </span>
        )}
      </div>

      <CardContent className="space-y-3 px-4 pt-3 pb-3">
        {/* Stat blocks */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-blue-50 px-2 py-1.5">
            <p className="text-lg font-bold text-blue-700">{workload.cardsInProgress}</p>
            <p className="text-[11px] text-blue-600">in progress</p>
          </div>
          <div className="rounded-md bg-amber-50 px-2 py-1.5">
            <p className="text-lg font-bold text-amber-700">{workload.cardsInReview}</p>
            <p className="text-[11px] text-amber-600">in review</p>
          </div>
          <div className="rounded-md bg-gray-50 px-2 py-1.5">
            <p className="text-lg font-bold text-gray-700">{workload.cardsOnHold ?? 0}</p>
            <p className="text-[11px] text-gray-500">on hold</p>
          </div>
        </div>

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
