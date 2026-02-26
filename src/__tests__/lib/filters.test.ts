import { describe, test, expect } from "vitest";
import { cardMatchesFilters } from "@/lib/filters";
import type { DashboardCard } from "@/lib/types";

function makeCard(overrides: Partial<DashboardCard> = {}): DashboardCard {
  return {
    id: "card-1",
    title: "Monthly Report Update",
    description: "Update the monthly report",
    status: "In Progress",
    bucket: "progress",
    statusOrder: 3,
    assignees: ["Daniel"],
    assigneeIds: ["member-daniel"],
    labels: [{ name: "Urgent", color: "red" }],
    dueDate: null,
    isOverdue: false,
    isComplete: false,
    lastActivity: new Date().toISOString(),
    checklistProgress: 50,
    checklistTotal: 4,
    checklistCompleted: 2,
    checklists: [],
    ...overrides,
  };
}

describe("cardMatchesFilters", () => {
  test("empty search matches all cards", () => {
    const card = makeCard();
    expect(cardMatchesFilters(card, "", null, null)).toBe(true);
  });

  test("all filters null/empty matches everything", () => {
    const card = makeCard();
    expect(cardMatchesFilters(card, "", null, null)).toBe(true);
  });

  test("search is case-insensitive", () => {
    const card = makeCard({ title: "Monthly Report Update" });

    expect(cardMatchesFilters(card, "monthly", null, null)).toBe(true);
    expect(cardMatchesFilters(card, "MONTHLY", null, null)).toBe(true);
    expect(cardMatchesFilters(card, "Monthly", null, null)).toBe(true);
    expect(cardMatchesFilters(card, "report update", null, null)).toBe(true);
  });

  test("search that does not match returns false", () => {
    const card = makeCard({ title: "Monthly Report Update" });
    expect(cardMatchesFilters(card, "quarterly", null, null)).toBe(false);
  });

  test("member filter with matching ID", () => {
    const card = makeCard({ assigneeIds: ["member-daniel"] });
    expect(cardMatchesFilters(card, "", "member-daniel", null)).toBe(true);
  });

  test("member filter with non-matching ID", () => {
    const card = makeCard({ assigneeIds: ["member-daniel"] });
    expect(cardMatchesFilters(card, "", "member-nathan", null)).toBe(false);
  });

  test("bucket filter with matching bucket", () => {
    const card = makeCard({ bucket: "progress" });
    expect(cardMatchesFilters(card, "", null, "progress")).toBe(true);
  });

  test("bucket filter with non-matching bucket", () => {
    const card = makeCard({ bucket: "progress" });
    expect(cardMatchesFilters(card, "", null, "onHold")).toBe(false);
  });

  test("combined filters: search + member", () => {
    const card = makeCard({
      title: "Monthly Report",
      assigneeIds: ["member-daniel"],
    });

    // Both match
    expect(cardMatchesFilters(card, "monthly", "member-daniel", null)).toBe(true);
    // Search matches, member doesn't
    expect(cardMatchesFilters(card, "monthly", "member-nathan", null)).toBe(false);
    // Search doesn't match, member does
    expect(cardMatchesFilters(card, "quarterly", "member-daniel", null)).toBe(false);
  });

  test("combined filters: search + member + bucket", () => {
    const card = makeCard({
      title: "Monthly Report",
      assigneeIds: ["member-daniel"],
      bucket: "progress",
    });

    // All match
    expect(
      cardMatchesFilters(card, "monthly", "member-daniel", "progress"),
    ).toBe(true);

    // One doesn't match
    expect(
      cardMatchesFilters(card, "monthly", "member-daniel", "onHold"),
    ).toBe(false);
  });

  test("card with multiple assignees matches any member filter", () => {
    const card = makeCard({
      assigneeIds: ["member-daniel", "member-nathan"],
    });

    expect(cardMatchesFilters(card, "", "member-daniel", null)).toBe(true);
    expect(cardMatchesFilters(card, "", "member-nathan", null)).toBe(true);
    expect(cardMatchesFilters(card, "", "member-randall", null)).toBe(false);
  });
});
