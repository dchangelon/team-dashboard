import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind class merge helper (shadcn pattern) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "5 min ago", "2 hours ago", "3 days ago" */
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** "Jan 15" or "Jan 15, 2025" (includes year if not current year) */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (date.getFullYear() !== now.getFullYear()) options.year = "numeric";
  return date.toLocaleDateString("en-US", options);
}
