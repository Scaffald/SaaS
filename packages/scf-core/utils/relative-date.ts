/**
 * Shared relative-date formatting ("5 days ago").
 *
 * Consolidates three near-identical copies (InternalJobCard, ExternalJobCard,
 * ConnectedAppsPanel) that all rendered singular counts with a plural noun —
 * "1 weeks ago", "1 months ago" (#387).
 */

/** Pluralize `noun` based on `count` ("1 week" / "2 weeks"). */
function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"} ago`;
}

/**
 * Format a past date as a coarse relative string.
 *
 * @example
 * formatRelativeDate('2026-07-21') // 'Yesterday'
 * formatRelativeDate(sevenDaysAgo) // '1 week ago'  (was '1 weeks ago')
 */
export function formatRelativeDate(
  dateString: string | Date | null | undefined,
): string {
  if (!dateString) {
    return "";
  }

  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffDays = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return "Today";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return plural(diffDays, "day");
  if (diffDays < 30) return plural(Math.floor(diffDays / 7), "week");
  if (diffDays < 365) return plural(Math.floor(diffDays / 30), "month");
  return plural(Math.floor(diffDays / 365), "year");
}
