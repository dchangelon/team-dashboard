"use client";

import type { DashboardCard, TeamMemberWorkload, TrelloMember } from "@/lib/types";
import {
  LIST_NAMES,
  STATUS_SORT_ORDER,
  PROJECT_LIST_GROUPS,
} from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberCard } from "./member-card";
import { ProjectCard } from "@/components/projects/project-card";
import { Inbox } from "lucide-react";

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
  allCards,
  workloads,
  members,
  isLoading,
  onCardClick,
}: TeamOverviewProps) {
  if (isLoading) {
    return (
      <div className="flex gap-6 items-start">
        <div className="flex-1 space-y-2">
          <Skeleton className="mb-4 h-4 w-20" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        <div className="w-64 xl:w-72 shrink-0">
          <Skeleton className="mb-4 h-4 w-28" />
          <div className="overflow-hidden rounded-xl border border-[#E0E0E4] bg-white divide-y divide-[#EBEBEF]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!workloads || !members) return null;

  // Recompute workloads from the filtered card set, but preserve original counts
  // for the capacity bar (so filters don't distort the capacity display)
  const filteredWorkloads: (TeamMemberWorkload & {
    allCardsTotal?: number;
    allCardsOnHold?: number;
    allCardsInProgress?: number;
    allCardsInReview?: number;
  })[] = workloads.map((w) => {
    const memberCards = cards.filter((c) => c.assigneeIds.includes(w.memberId));

    const cardsInProgress = memberCards.filter(
      (c) => c.bucket === "progress",
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
        ? Math.round(
            progressValues.reduce((a, b) => a + b, 0) / progressValues.length,
          )
        : 0;

    const overdueCards = memberCards.filter((c) => c.isOverdue).length;

    const sortedCards = [...memberCards].sort(
      (a, b) =>
        (STATUS_SORT_ORDER[a.status] ?? 99) -
        (STATUS_SORT_ORDER[b.status] ?? 99),
    );

    // Unfiltered counts for the capacity bar — derived from allCards prop (always fresh,
    // never cached), so they're correct regardless of cache state or active filters.
    const allMemberCards = allCards.filter(
      (c) => c.assigneeIds.includes(w.memberId) && !c.isComplete,
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
      allCardsTotal: allMemberCards.length,
      allCardsOnHold: allMemberCards.filter((c) => c.bucket === "onHold").length,
      allCardsInProgress: allMemberCards.filter((c) => c.bucket === "progress").length,
      allCardsInReview: allMemberCards.filter((c) => c.bucket === "review").length,
    };
  });

  // Unassigned cards
  const memberIdSet = new Set(workloads.map((w) => w.memberId));
  const unassignedCards = cards.filter(
    (c) => !c.assigneeIds.some((id) => memberIdSet.has(id)),
  );
  const sortedUnassigned = [...unassignedCards].sort(
    (a, b) =>
      (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99),
  );
  const unassignedWorkload:
    | (TeamMemberWorkload & { allCardsTotal?: number; allCardsOnHold?: number })
    | null =
    unassignedCards.length > 0
      ? {
          memberId: "__unassigned__",
          memberName: "Unassigned",
          cardsInProgress: unassignedCards.filter(
            (c) => c.status === LIST_NAMES.IN_PROGRESS,
          ).length,
          cardsInReview: unassignedCards.filter(
            (c) => c.status === LIST_NAMES.REVIEW,
          ).length,
          cardsOnHold: unassignedCards.filter(
            (c) => c.status === LIST_NAMES.ON_HOLD,
          ).length,
          cardsCompleted: unassignedCards.filter(
            (c) => c.status === LIST_NAMES.COMPLETED,
          ).length,
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

  // Group cards by status for the project list
  const sortedCards = [...cards].sort(
    (a, b) =>
      (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99),
  );

  const cardsByStatus = new Map<string, DashboardCard[]>();
  for (const card of sortedCards) {
    const existing = cardsByStatus.get(card.status) ?? [];
    existing.push(card);
    cardsByStatus.set(card.status, existing);
  }

  return (
    <div className="flex h-full gap-6">
      {/* ── LEFT: Grouped project list ──────────────────────────────── */}
      <section className="min-w-0 flex-1 overflow-y-auto pr-1">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#5B5B6E]">
            Projects
          </h2>
          {cards.length > 0 && (
            <span className="tabular-nums text-xs text-[#8A8A9B]">
              {cards.length} shown
            </span>
          )}
        </div>

        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E0E0E4] py-14 text-center">
            <Inbox className="mb-2 h-8 w-8 text-[#D0D0D8]" />
            <p className="text-sm font-medium text-[#8A8A9B]">
              No projects match your filters
            </p>
            <p className="mt-0.5 text-xs text-[#ABABBB]">
              Try adjusting your search or clearing the filters above
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {PROJECT_LIST_GROUPS.map((group) => {
              // Collect all cards that belong to this group's statuses
              const groupCards = group.statuses.flatMap(
                (s) => cardsByStatus.get(s) ?? [],
              );
              if (groupCards.length === 0) return null;

              return (
                <div key={group.label}>
                  {/* Group header */}
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#5B5B6E]">
                      {group.label}
                    </span>
                    <span className="rounded-full bg-[#EBEBEF] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[#8A8A9B]">
                      {groupCards.length}
                    </span>
                  </div>

                  {/* Cards in this group */}
                  <div className="space-y-2">
                    {groupCards.map((card) => (
                      <ProjectCard
                        key={card.id}
                        card={card}
                        onClick={() => onCardClick(card)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── RIGHT: Team capacity sidebar ──────────────────────────── */}
      <aside className="flex w-64 xl:w-72 shrink-0 flex-col">
        <h2 className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-wider text-[#5B5B6E]">
          Team Capacity
        </h2>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="overflow-hidden rounded-xl border border-[#E0E0E4] bg-white divide-y divide-[#EBEBEF]">
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

          {/* Capacity legend */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#8A8A9B]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#3FA557]" /> Light
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#D9853B]" /> Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#D4281C]" /> High
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#6B7280]" /> On hold
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
