import { describe, test, expect, vi, beforeEach } from "vitest";
import type {
  TrelloCard,
  TrelloLabel,
  TrelloList,
  TrelloMember,
} from "@/lib/types";

// Mock env before importing the service
vi.mock("@/lib/env", () => ({
  env: {
    TRELLO_API_KEY: "test-key",
    TRELLO_TOKEN: "test-token",
    TRELLO_BOARD_ID: "test-board",
    TEAM_MEMBER_IDS: "member-daniel,member-nathan",
    EXCLUDE_MEMBER_IDS: "member-randall",
  },
  teamMemberIds: ["member-daniel", "member-nathan"],
  excludeMemberIds: ["member-randall"],
}));

// Import after mock setup
import {
  transformCard,
  buildSummary,
  buildWorkloads,
} from "@/lib/trello-data-service";

// ===== Test Fixtures =====

const LISTS: TrelloList[] = [
  { id: "list-queue", name: "Change Request Queue", pos: 1 },
  { id: "list-planning", name: "Reviewing and Planning", pos: 2 },
  { id: "list-progress", name: "In Progress", pos: 3 },
  { id: "list-review", name: "Pending Review", pos: 4 },
  { id: "list-completed", name: "Completed", pos: 5 },
  { id: "list-hold", name: "On Hold", pos: 6 },
];

const MEMBERS: TrelloMember[] = [
  { id: "member-daniel", fullName: "Daniel", username: "daniel", avatarUrl: null },
  { id: "member-nathan", fullName: "Nathan", username: "nathan", avatarUrl: null },
  { id: "member-randall", fullName: "Randall", username: "randall", avatarUrl: null },
];

const LABELS: TrelloLabel[] = [
  { id: "label-urgent", name: "Urgent", color: "red" },
  { id: "label-data", name: "Data Request", color: "blue" },
];

const listById = new Map(LISTS.map((l) => [l.id, l]));
const memberById = new Map(MEMBERS.map((m) => [m.id, m]));
const labelById = new Map(LABELS.map((l) => [l.id, l]));

function makeCard(overrides: Partial<TrelloCard> = {}): TrelloCard {
  return {
    id: "card-1",
    name: "Test Card",
    desc: "A test card description",
    idList: "list-progress",
    idMembers: ["member-daniel"],
    idLabels: ["label-urgent"],
    due: null,
    dueComplete: false,
    dateLastActivity: new Date().toISOString(),
    shortUrl: "https://trello.com/c/abc123",
    checklists: [],
    ...overrides,
  };
}

// ===== transformCard Tests =====

describe("transformCard", () => {
  test("transforms a full card with all fields", () => {
    const card = makeCard({
      checklists: [
        {
          id: "cl-1",
          name: "Setup Tasks",
          checkItems: [
            { id: "ci-1", name: "Install deps", state: "complete" },
            { id: "ci-2", name: "Write tests", state: "incomplete" },
            { id: "ci-3", name: "Deploy", state: "complete" },
          ],
        },
      ],
    });

    const result = transformCard(card, listById, memberById, labelById);

    expect(result.id).toBe("card-1");
    expect(result.title).toBe("Test Card");
    expect(result.description).toBe("A test card description");
    expect(result.status).toBe("In Progress");
    expect(result.bucket).toBe("progress");
    expect(result.statusOrder).toBe(3);
    expect(result.assignees).toEqual(["Daniel"]);
    expect(result.assigneeIds).toEqual(["member-daniel"]);
    expect(result.labels).toEqual([{ name: "Urgent", color: "red" }]);
    expect(result.trelloUrl).toBe("https://trello.com/c/abc123");
    expect(result.checklistProgress).toBe(67); // 2/3
    expect(result.checklistTotal).toBe(3);
    expect(result.checklistCompleted).toBe(2);
    expect(result.checklists).toHaveLength(1);
    expect(result.checklists[0].completed).toBe(2);
    expect(result.checklists[0].total).toBe(3);
  });

  test("card with no checklists has 0 progress", () => {
    const card = makeCard({ checklists: [] });
    const result = transformCard(card, listById, memberById, labelById);

    expect(result.checklistProgress).toBe(0);
    expect(result.checklistTotal).toBe(0);
    expect(result.checklistCompleted).toBe(0);
    expect(result.checklists).toHaveLength(0);
  });

  test("card with no due date is not overdue", () => {
    const card = makeCard({ due: null });
    const result = transformCard(card, listById, memberById, labelById);

    expect(result.dueDate).toBeNull();
    expect(result.isOverdue).toBe(false);
  });

  test("card with no members has empty assignees", () => {
    const card = makeCard({ idMembers: [], idLabels: [] });
    const result = transformCard(card, listById, memberById, labelById);

    expect(result.assignees).toEqual([]);
    expect(result.assigneeIds).toEqual([]);
    expect(result.labels).toEqual([]);
  });

  test("overdue card (past due, not complete)", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const card = makeCard({
      due: pastDate.toISOString(),
      dueComplete: false,
    });
    const result = transformCard(card, listById, memberById, labelById);

    expect(result.isOverdue).toBe(true);
  });

  test("completed due card is not overdue (dueComplete = true)", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const card = makeCard({
      due: pastDate.toISOString(),
      dueComplete: true,
    });
    const result = transformCard(card, listById, memberById, labelById);

    expect(result.isOverdue).toBe(false);
  });

  test("card in Completed list has isComplete = true and completed bucket", () => {
    const card = makeCard({ idList: "list-completed" });
    const result = transformCard(card, listById, memberById, labelById);

    expect(result.isComplete).toBe(true);
    expect(result.status).toBe("Completed");
    expect(result.bucket).toBe("completed");
  });

  test("card in In Progress list has isComplete = false and progress bucket", () => {
    const card = makeCard({ idList: "list-progress" });
    const result = transformCard(card, listById, memberById, labelById);

    expect(result.isComplete).toBe(false);
    expect(result.bucket).toBe("progress");
  });

  test("card in queue list has queue bucket", () => {
    const card = makeCard({ idList: "list-queue" });
    const result = transformCard(card, listById, memberById, labelById);

    expect(result.bucket).toBe("queue");
  });

  test("card in On Hold list has onHold bucket", () => {
    const card = makeCard({ idList: "list-hold" });
    const result = transformCard(card, listById, memberById, labelById);

    expect(result.bucket).toBe("onHold");
  });

  test("multiple checklists aggregate correctly", () => {
    const card = makeCard({
      checklists: [
        {
          id: "cl-1",
          name: "Checklist A",
          checkItems: [
            { id: "ci-1", name: "Item 1", state: "complete" },
            { id: "ci-2", name: "Item 2", state: "complete" },
          ],
        },
        {
          id: "cl-2",
          name: "Checklist B",
          checkItems: [
            { id: "ci-3", name: "Item 3", state: "incomplete" },
            { id: "ci-4", name: "Item 4", state: "incomplete" },
          ],
        },
      ],
    });

    const result = transformCard(card, listById, memberById, labelById);

    expect(result.checklistTotal).toBe(4);
    expect(result.checklistCompleted).toBe(2);
    expect(result.checklistProgress).toBe(50);
    expect(result.checklists).toHaveLength(2);
  });
});

// ===== buildSummary Tests =====

describe("buildSummary", () => {
  function makeDashboardCards() {
    const now = new Date();
    const recentDate = new Date(now);
    recentDate.setDate(recentDate.getDate() - 10);
    const oldDate = new Date(now);
    oldDate.setDate(oldDate.getDate() - 60);

    const pastDue = new Date(now);
    pastDue.setDate(pastDue.getDate() - 3);

    return [
      // Queue cards
      transformCard(
        makeCard({ id: "q1", idList: "list-queue", idMembers: ["member-daniel"] }),
        listById, memberById, labelById,
      ),
      transformCard(
        makeCard({ id: "q2", idList: "list-queue", idMembers: ["member-nathan"] }),
        listById, memberById, labelById,
      ),
      // In Progress
      transformCard(
        makeCard({
          id: "ip1", idList: "list-progress", idMembers: ["member-daniel"],
          due: pastDue.toISOString(), dueComplete: false,
        }),
        listById, memberById, labelById,
      ),
      // Review
      transformCard(
        makeCard({ id: "r1", idList: "list-review", idMembers: ["member-nathan"] }),
        listById, memberById, labelById,
      ),
      // Recently completed
      transformCard(
        makeCard({
          id: "c1", idList: "list-completed",
          dateLastActivity: recentDate.toISOString(),
        }),
        listById, memberById, labelById,
      ),
      // Old completed (outside lookback window)
      transformCard(
        makeCard({
          id: "c2", idList: "list-completed",
          dateLastActivity: oldDate.toISOString(),
        }),
        listById, memberById, labelById,
      ),
      // On Hold
      transformCard(
        makeCard({ id: "h1", idList: "list-hold" }),
        listById, memberById, labelById,
      ),
    ];
  }

  test("counts cards by status correctly", () => {
    const cards = makeDashboardCards();
    const summary = buildSummary(cards, LISTS);

    expect(summary.queueDepth).toBe(2);
    expect(summary.inProgress).toBe(2); // In Progress + Review (both in "progress" bucket)
    expect(summary.onHold).toBe(1);
    expect(summary.totalCards).toBe(7);
  });

  test("recentlyCompleted only counts last 30 days", () => {
    const cards = makeDashboardCards();
    const summary = buildSummary(cards, LISTS);

    expect(summary.recentlyCompleted).toBe(1); // Only the recent one, not the 60-day-old one
  });

  test("overdueCount matches overdue cards", () => {
    const cards = makeDashboardCards();
    const summary = buildSummary(cards, LISTS);

    expect(summary.overdueCount).toBe(1); // Only ip1 is overdue
  });

  test("byStatus has correct breakdown", () => {
    const cards = makeDashboardCards();
    const summary = buildSummary(cards, LISTS);

    expect(summary.byStatus["Change Request Queue"]).toBe(2);
    expect(summary.byStatus["In Progress"]).toBe(1);
    expect(summary.byStatus["Pending Review"]).toBe(1);
    expect(summary.byStatus["Completed"]).toBe(2);
    expect(summary.byStatus["On Hold"]).toBe(1);
  });

  test("lastUpdated is a valid ISO string", () => {
    const cards = makeDashboardCards();
    const summary = buildSummary(cards, LISTS);

    expect(() => new Date(summary.lastUpdated)).not.toThrow();
    expect(new Date(summary.lastUpdated).toISOString()).toBe(
      summary.lastUpdated,
    );
  });
});

// ===== buildWorkloads Tests =====

describe("buildWorkloads", () => {
  function makeWorkloadCards() {
    const pastDue = new Date();
    pastDue.setDate(pastDue.getDate() - 2);

    return [
      // Daniel: 2 cards in progress, 1 overdue
      transformCard(
        makeCard({
          id: "d1", idList: "list-progress", idMembers: ["member-daniel"],
          checklists: [{
            id: "cl-1", name: "Tasks",
            checkItems: [
              { id: "ci-1", name: "A", state: "complete" },
              { id: "ci-2", name: "B", state: "incomplete" },
            ],
          }],
        }),
        listById, memberById, labelById,
      ),
      transformCard(
        makeCard({
          id: "d2", idList: "list-progress", idMembers: ["member-daniel"],
          due: pastDue.toISOString(), dueComplete: false,
          checklists: [{
            id: "cl-2", name: "Tasks",
            checkItems: [
              { id: "ci-3", name: "C", state: "complete" },
              { id: "ci-4", name: "D", state: "complete" },
            ],
          }],
        }),
        listById, memberById, labelById,
      ),
      // Nathan: 1 card in review
      transformCard(
        makeCard({ id: "n1", idList: "list-review", idMembers: ["member-nathan"] }),
        listById, memberById, labelById,
      ),
      // Randall: 1 card (should be excluded from workloads)
      transformCard(
        makeCard({ id: "r1", idList: "list-progress", idMembers: ["member-randall"] }),
        listById, memberById, labelById,
      ),
      // Daniel: completed card (should not count in workload totals)
      transformCard(
        makeCard({ id: "d3", idList: "list-completed", idMembers: ["member-daniel"] }),
        listById, memberById, labelById,
      ),
    ];
  }

  test("includes only team members (Daniel and Nathan)", () => {
    const cards = makeWorkloadCards();
    const workloads = buildWorkloads(
      cards,
      ["member-daniel", "member-nathan"],
      memberById,
      ["member-randall"],
    );

    expect(workloads).toHaveLength(2);
    expect(workloads.map((w) => w.memberName)).toEqual(["Daniel", "Nathan"]);
  });

  test("excludes Randall from workloads", () => {
    const cards = makeWorkloadCards();
    const workloads = buildWorkloads(
      cards,
      ["member-daniel", "member-nathan", "member-randall"],
      memberById,
      ["member-randall"],
    );

    expect(workloads.find((w) => w.memberName === "Randall")).toBeUndefined();
  });

  test("groups cards correctly per member", () => {
    const cards = makeWorkloadCards();
    const workloads = buildWorkloads(
      cards,
      ["member-daniel", "member-nathan"],
      memberById,
      ["member-randall"],
    );

    const daniel = workloads.find((w) => w.memberName === "Daniel")!;
    expect(daniel.cardsInProgress).toBe(2);
    expect(daniel.cardsInReview).toBe(0);
    expect(daniel.cardsTotal).toBe(2); // Excludes completed
    expect(daniel.overdueCards).toBe(1);

    const nathan = workloads.find((w) => w.memberName === "Nathan")!;
    expect(nathan.cardsInProgress).toBe(0);
    expect(nathan.cardsInReview).toBe(1);
    expect(nathan.cardsTotal).toBe(1);
    expect(nathan.overdueCards).toBe(0);
  });

  test("calculates average checklist progress", () => {
    const cards = makeWorkloadCards();
    const workloads = buildWorkloads(
      cards,
      ["member-daniel", "member-nathan"],
      memberById,
      ["member-randall"],
    );

    const daniel = workloads.find((w) => w.memberName === "Daniel")!;
    // Card d1: 50% (1/2), Card d2: 100% (2/2) → average = 75%
    expect(daniel.averageProgress).toBe(75);
  });

  test("member with no cards has zero stats", () => {
    const workloads = buildWorkloads(
      [], // no cards
      ["member-daniel"],
      memberById,
      [],
    );

    expect(workloads).toHaveLength(1);
    expect(workloads[0].cardsTotal).toBe(0);
    expect(workloads[0].averageProgress).toBe(0);
    expect(workloads[0].overdueCards).toBe(0);
  });
});
