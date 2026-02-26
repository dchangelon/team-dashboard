"use client";

import type { DashboardCard, TeamMemberWorkload, TrelloMember } from "@/lib/types";
import { LIST_NAMES, STATUS_SORT_ORDER } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { MemberCard } from "./member-card";

interface TeamOverviewProps {
  cards: DashboardCard[];
  allCards: DashboardCard[];
  workloads: TeamMemberWorkload[] | undefined;
  members: TrelloMember[] | undefined;
  isLoading: boolean;
  onCardClick: (card: DashboardCard) => void;
}

export function TeamOverview({
  cards,
  workloads,
  members,
  isLoading,
  onCardClick,
}: TeamOverviewProps) {
  if (isLoading) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Team Workload</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="mb-2 h-4 w-48" />
                <Skeleton className="h-1.5 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (!workloads || !members) return null;

  // Recompute workloads from filtered cards so filters apply to workload section
  const filteredWorkloads: TeamMemberWorkload[] = workloads.map((w) => {
    const memberCards = cards.filter(
      (c) => c.assigneeIds.includes(w.memberId),
    );

    const cardsInProgress = memberCards.filter(
      (c) => c.status === LIST_NAMES.IN_PROGRESS,
    ).length;
    const cardsInReview = memberCards.filter(
      (c) => c.status === LIST_NAMES.REVIEW,
    ).length;
    const cardsOnHold = memberCards.filter(
      (c) => c.status === LIST_NAMES.ON_HOLD,
    ).length;
    const cardsCompleted = memberCards.filter(
      (c) => c.status === LIST_NAMES.COMPLETED,
    ).length;

    const progressValues = memberCards
      .filter((c) => c.checklistTotal > 0)
      .map((c) => c.checklistProgress);
    const averageProgress =
      progressValues.length > 0
        ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
        : 0;

    const overdueCards = memberCards.filter((c) => c.isOverdue).length;

    const sortedCards = [...memberCards].sort(
      (a, b) => (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99),
    );

    return {
      ...w,
      cardsInProgress,
      cardsInReview,
      cardsOnHold,
      cardsCompleted,
      cardsTotal: memberCards.length,
      averageProgress,
      overdueCards,
      cards: sortedCards,
      allCardsTotal: w.cardsTotal,
    };
  });

  // Collect cards not assigned to any known team member
  const memberIdSet = new Set(workloads.map((w) => w.memberId));
  const unassignedCards = cards.filter(
    (c) => !c.assigneeIds.some((id) => memberIdSet.has(id)),
  );

  // Build synthetic workload for unassigned cards
  const sortedUnassigned = [...unassignedCards].sort(
    (a, b) => (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99),
  );
  const unassignedWorkload: TeamMemberWorkload & { allCardsTotal?: number } | null =
    unassignedCards.length > 0
      ? {
          memberId: "__unassigned__",
          memberName: "In Queue / Unassigned",
          cardsInProgress: unassignedCards.filter((c) => c.status === LIST_NAMES.IN_PROGRESS).length,
          cardsInReview: unassignedCards.filter((c) => c.status === LIST_NAMES.REVIEW).length,
          cardsOnHold: unassignedCards.filter((c) => c.status === LIST_NAMES.ON_HOLD).length,
          cardsCompleted: unassignedCards.filter((c) => c.status === LIST_NAMES.COMPLETED).length,
          cardsTotal: unassignedCards.length,
          averageProgress:
            unassignedCards.filter((c) => c.checklistTotal > 0).length > 0
              ? Math.round(
                  unassignedCards
                    .filter((c) => c.checklistTotal > 0)
                    .reduce((sum, c) => sum + c.checklistProgress, 0) /
                    unassignedCards.filter((c) => c.checklistTotal > 0).length,
                )
              : 0,
          overdueCards: unassignedCards.filter((c) => c.isOverdue).length,
          cards: sortedUnassigned,
        }
      : null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Team Workload</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorkloads.map((workload) => (
          <MemberCard
            key={workload.memberId}
            workload={workload}
            onCardClick={onCardClick}
          />
        ))}
        {unassignedWorkload && (
          <MemberCard
            key="__unassigned__"
            workload={unassignedWorkload}
            onCardClick={onCardClick}
          />
        )}
      </div>
    </section>
  );
}
