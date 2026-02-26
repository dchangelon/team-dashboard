import type { DashboardCard } from "./types";

/**
 * Check if a card matches the active filter criteria.
 * Used by page.tsx to produce filteredCards consumed by project list + workload.
 */
export function cardMatchesFilters(
  card: DashboardCard,
  search: string,
  member: string | null,
  bucket: string | null
): boolean {
  // Search filter — matches card title (case-insensitive)
  if (search) {
    const searchLower = search.toLowerCase();
    if (!card.title.toLowerCase().includes(searchLower)) return false;
  }

  // Member filter — matches any assignee ID
  if (member && !card.assigneeIds.includes(member)) return false;

  // Bucket filter — matches card's bucket key
  if (bucket && card.bucket !== bucket) return false;

  return true;
}
