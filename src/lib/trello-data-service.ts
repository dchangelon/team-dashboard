/**
 * Trello Data Service
 *
 * Fetches all board data in parallel, transforms to DashboardData,
 * and wraps with unstable_cache for 30-min server-side caching.
 *
 * Tag-based invalidation: POST /api/revalidate calls revalidateTag("trello", "max")
 * to bust this cache on demand.
 */

import { unstable_cache } from "next/cache";
import { TrelloClient } from "./trello-client";
import { env, teamMemberIds, excludeMemberIds } from "./env";
import {
  CACHE_REVALIDATE_SECONDS,
  LIST_NAMES,
  BUCKETS,
  ALLOWED_LISTS,
  COMPLETED_LOOKBACK_DAYS,
  getBucketForStatus,
} from "./constants";
import type {
  TrelloCard,
  TrelloLabel,
  TrelloList,
  TrelloMember,
  DashboardCard,
  DashboardChecklist,
  DashboardData,
  BoardSummary,
  TeamMemberWorkload,
} from "./types";

// ===== Transformation Functions (exported for testability) =====

export function transformCard(
  card: TrelloCard,
  listById: Map<string, TrelloList>,
  memberById: Map<string, TrelloMember>,
  labelById: Map<string, TrelloLabel>,
): DashboardCard {
  const list = listById.get(card.idList);
  const status = list?.name ?? "Unknown";
  const statusOrder = list?.pos ?? 0;

  const assignees = card.idMembers
    .map((id) => memberById.get(id)?.fullName)
    .filter((name): name is string => name !== undefined);

  const labels = card.idLabels
    .map((id) => labelById.get(id))
    .filter((label): label is TrelloLabel => label !== undefined)
    .map((label) => ({ name: label.name, color: label.color }));

  const checklists: DashboardChecklist[] = (card.checklists ?? []).map((cl) => {
    const items = cl.checkItems.map((item) => ({
      name: item.name,
      complete: item.state === "complete",
    }));
    const completed = items.filter((i) => i.complete).length;
    return { name: cl.name, items, completed, total: items.length };
  });

  const checklistTotal = checklists.reduce((sum, cl) => sum + cl.total, 0);
  const checklistCompleted = checklists.reduce(
    (sum, cl) => sum + cl.completed,
    0,
  );
  const checklistProgress =
    checklistTotal > 0
      ? Math.round((checklistCompleted / checklistTotal) * 100)
      : 0;

  const isOverdue =
    card.due !== null && !card.dueComplete && new Date(card.due) < new Date();

  const isComplete = status === LIST_NAMES.COMPLETED;

  const bucket = getBucketForStatus(status) ?? "progress";

  return {
    id: card.id,
    title: card.name,
    description: card.desc,
    status,
    bucket,
    statusOrder,
    assignees,
    assigneeIds: card.idMembers,
    labels,
    dueDate: card.due,
    isOverdue,
    isComplete,
    lastActivity: card.dateLastActivity,
    checklistProgress,
    checklistTotal,
    checklistCompleted,
    checklists,
  };
}

export function buildSummary(
  cards: DashboardCard[],
  lists: TrelloList[],
): BoardSummary {
  const byStatus: Record<string, number> = {};
  const byMember: Record<string, number> = {};

  for (const card of cards) {
    byStatus[card.status] = (byStatus[card.status] ?? 0) + 1;
    for (const name of card.assignees) {
      byMember[name] = (byMember[name] ?? 0) + 1;
    }
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - COMPLETED_LOOKBACK_DAYS);

  // Bucket-based counting
  const queueDepth = cards.filter((c) => c.bucket === "queue").length;
  const inProgress = cards.filter((c) => c.bucket === "progress").length;
  const recentlyCompleted = cards.filter(
    (c) =>
      c.bucket === "completed" &&
      new Date(c.lastActivity) >= cutoff,
  ).length;
  const onHold = cards.filter((c) => c.bucket === "onHold").length;
  const overdueCount = cards.filter((c) => c.isOverdue).length;

  return {
    totalCards: cards.length,
    byStatus,
    byMember,
    queueDepth,
    inProgress,
    recentlyCompleted,
    onHold,
    overdueCount,
    lastUpdated: new Date().toISOString(),
  };
}

export function buildWorkloads(
  cards: DashboardCard[],
  memberIds: string[],
  memberById: Map<string, TrelloMember>,
  excludeIds: string[],
): TeamMemberWorkload[] {
  const filteredMemberIds = memberIds.filter(
    (id) => !excludeIds.includes(id),
  );

  return filteredMemberIds.map((memberId) => {
    const member = memberById.get(memberId);
    const memberName = member?.fullName ?? "Unknown";

    // All non-completed cards assigned to this member
    const memberCards = cards.filter(
      (c) => c.assigneeIds.includes(memberId) && !c.isComplete,
    );

    const cardsInProgress = memberCards.filter(
      (c) =>
        c.status === LIST_NAMES.IN_PROGRESS ||
        c.status === LIST_NAMES.PLANNING,
    ).length;
    const cardsInReview = memberCards.filter(
      (c) => c.status === LIST_NAMES.REVIEW,
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

    return {
      memberId,
      memberName,
      cardsInProgress,
      cardsInReview,
      cardsTotal: memberCards.length,
      averageProgress,
      overdueCards,
      cards: memberCards,
    };
  });
}

// ===== List Name Validation =====

function validateListNames(fetchedLists: TrelloList[]): void {
  const fetchedNames = new Set(fetchedLists.map((l) => l.name));
  const expectedNames = Object.values(LIST_NAMES);

  for (const expected of expectedNames) {
    if (!fetchedNames.has(expected)) {
      console.warn(
        `[trello-data-service] Expected list "${expected}" not found on board. ` +
          `Metrics depending on this list will return 0. ` +
          `Fetched lists: ${[...fetchedNames].join(", ")}`,
      );
    }
  }
}

// ===== Cached Data Service =====

async function fetchAndTransform(): Promise<DashboardData> {
  const client = new TrelloClient();

  // Fetch all 4 resources in parallel
  const [lists, rawCards, members, labels] = await Promise.all([
    client.getLists(),
    client.getCards(),
    client.getMembers(),
    client.getLabels(),
  ]);

  // Validate list names
  validateListNames(lists);

  // Build lookup maps
  const listById = new Map(lists.map((l) => [l.id, l]));
  const memberById = new Map(members.map((m) => [m.id, m]));
  const labelById = new Map(labels.map((l) => [l.id, l]));

  // Transform cards and filter to only allowed lists
  const cards = rawCards
    .map((card) => transformCard(card, listById, memberById, labelById))
    .filter((card) => ALLOWED_LISTS.has(card.status));

  // Filter completed cards to lookback window
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - COMPLETED_LOOKBACK_DAYS);
  const filteredCards = cards.filter((card) => {
    if (card.status === LIST_NAMES.COMPLETED) {
      return new Date(card.lastActivity) >= cutoff;
    }
    return true;
  });

  // Build aggregations
  const summary = buildSummary(filteredCards, lists);
  const workloads = buildWorkloads(
    filteredCards,
    teamMemberIds,
    memberById,
    excludeMemberIds,
  );

  return {
    summary,
    cards: filteredCards,
    members,
    lists,
    workloads,
  };
}

const getCachedDashboard = unstable_cache(
  fetchAndTransform,
  ["trello-dashboard", env.TRELLO_BOARD_ID],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: ["trello"] },
);

/**
 * Get full dashboard data. Cached at the service level (30 min).
 * Bust cache via revalidateTag("trello", "max").
 */
export async function getDashboardData(): Promise<DashboardData> {
  return getCachedDashboard();
}
