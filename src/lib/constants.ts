// === Cache & Timing ===
export const CACHE_REVALIDATE_SECONDS = 1800; // 30 min server cache (board changes infrequently)
export const TANSTACK_STALE_TIME_MS = 5 * 60 * 1000; // 5 min client staleTime
export const SEARCH_DEBOUNCE_MS = 300;

// === Staleness thresholds (days since last activity) ===
export const STALENESS_THRESHOLDS = {
  stale: 5,  // 5+ days: amber warning
  stuck: 10, // 10+ days: red warning
} as const;

// === Status health thresholds ===
export const HEALTH_THRESHOLDS = {
  queueDepth: { green: 5, yellow: 10 }, // >= yellow = yellow, >= red = red
  onHold: { green: 1, yellow: 3 },
} as const;

// === Trello list names from "The Report Report" board ===
// WARNING: If these are renamed on the Trello board, metrics will silently return 0.
// The data service validates fetched list names against these constants at runtime.
export const LIST_NAMES = {
  QUEUE: "Change Request Queue",
  NEW_PROJECT_QUEUE: "New Project Queue",
  PLANNING: "Reviewing and Planning",
  IN_PROGRESS: "In Progress",
  REVIEW: "Pending Review",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
} as const;

// === Status sort order for project lists within member cards ===
// Lower number = appears first. In Progress → Planning → Review → On Hold → Completed → Queue
export const STATUS_SORT_ORDER: Record<string, number> = {
  [LIST_NAMES.IN_PROGRESS]: 0,
  [LIST_NAMES.PLANNING]: 1,
  [LIST_NAMES.REVIEW]: 2,
  [LIST_NAMES.ON_HOLD]: 3,
  [LIST_NAMES.COMPLETED]: 4,
  [LIST_NAMES.QUEUE]: 5,
  [LIST_NAMES.NEW_PROJECT_QUEUE]: 6,
};

// === Bucket groupings ===
// High-level categories for the dashboard. Each bucket aggregates one or more Trello lists.
// Display order: progress → queue → onHold → completed (active work first)
export const BUCKETS = {
  progress: {
    label: "In Progress",
    lists: [LIST_NAMES.PLANNING, LIST_NAMES.IN_PROGRESS, LIST_NAMES.REVIEW] as readonly string[],
  },
  queue: {
    label: "Queue",
    lists: [LIST_NAMES.QUEUE, LIST_NAMES.NEW_PROJECT_QUEUE] as readonly string[],
  },
  onHold: {
    label: "On Hold",
    lists: [LIST_NAMES.ON_HOLD] as readonly string[],
  },
  completed: {
    label: "Completed",
    lists: [LIST_NAMES.COMPLETED] as readonly string[],
  },
} as const;

export type BucketKey = keyof typeof BUCKETS;

// Display order for bucket sections (pipeline flow: left-to-right)
export const BUCKET_ORDER: BucketKey[] = ["queue", "progress", "onHold", "completed"];

// Flat set of all lists the app cares about — cards from unlisted Trello lists are filtered out
export const ALLOWED_LISTS = new Set(
  Object.values(BUCKETS).flatMap((b) => b.lists),
);

// Completed cards: only show last N days
export const COMPLETED_LOOKBACK_DAYS = 30;

// === Label color mapping (Trello color → Tailwind class) ===
// Trello returns base colors plus _dark and _light variants
export const LABEL_COLORS: Record<string, string> = {
  // Base
  red: "bg-red-100 text-red-800",
  orange: "bg-orange-100 text-orange-800",
  yellow: "bg-yellow-100 text-yellow-800",
  green: "bg-green-100 text-green-800",
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
  pink: "bg-pink-100 text-pink-800",
  sky: "bg-sky-100 text-sky-800",
  lime: "bg-lime-100 text-lime-800",
  black: "bg-gray-800 text-gray-100",
  // Dark variants
  red_dark: "bg-red-200 text-red-900",
  orange_dark: "bg-orange-200 text-orange-900",
  yellow_dark: "bg-yellow-200 text-yellow-900",
  green_dark: "bg-green-200 text-green-900",
  blue_dark: "bg-blue-200 text-blue-900",
  purple_dark: "bg-purple-200 text-purple-900",
  pink_dark: "bg-pink-200 text-pink-900",
  sky_dark: "bg-sky-200 text-sky-900",
  lime_dark: "bg-lime-200 text-lime-900",
  black_dark: "bg-gray-900 text-gray-100",
  // Light variants
  red_light: "bg-red-50 text-red-600",
  orange_light: "bg-orange-50 text-orange-600",
  yellow_light: "bg-yellow-50 text-yellow-600",
  green_light: "bg-green-50 text-green-600",
  blue_light: "bg-blue-50 text-blue-600",
  purple_light: "bg-purple-50 text-purple-600",
  pink_light: "bg-pink-50 text-pink-600",
  sky_light: "bg-sky-50 text-sky-600",
  lime_light: "bg-lime-50 text-lime-600",
  black_light: "bg-gray-600 text-gray-100",
};

// === Bucket color mapping (status → visual classes) ===
export const BUCKET_COLORS: Record<
  BucketKey,
  { border: string; dot: string; badge: string; bg: string }
> = {
  progress: {
    border: "border-l-blue-500",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700",
    bg: "",
  },
  queue: {
    border: "border-l-amber-500",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700",
    bg: "",
  },
  onHold: {
    border: "border-l-gray-400",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600",
    bg: "",
  },
  completed: {
    border: "border-l-green-500",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700",
    bg: "",
  },
};

// === Team workload capacity thresholds ===
export const CAPACITY_THRESHOLDS = {
  available: 2, // 0-2 active cards: green (light load)
  nearCapacity: 4, // 3-4 active cards: yellow (moderate load); 5+: red (high load)
} as const;

// === Progress color thresholds (shared by ProgressBar + ProgressRing) ===
export function getProgressColor(value: number): string {
  if (value === 100) return "bg-green-500";
  if (value >= 60) return "bg-blue-500";
  if (value >= 30) return "bg-yellow-500";
  return "bg-gray-400";
}

export function getProgressStrokeColor(value: number): string {
  if (value === 100) return "text-green-500";
  if (value >= 60) return "text-blue-500";
  if (value >= 30) return "text-yellow-500";
  return "text-gray-400";
}

// === Utility: resolve bucket key from a Trello list name ===
export function getBucketForStatus(status: string): BucketKey | null {
  for (const [key, bucket] of Object.entries(BUCKETS)) {
    if (bucket.lists.includes(status)) return key as BucketKey;
  }
  return null;
}
