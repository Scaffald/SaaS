import { format } from "date-fns";

/**
 * Format a date string to a readable format
 * @param dateStr - ISO date string
 * @returns Formatted date string (MMM yyyy) or 'N/A' if invalid
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    return format(new Date(dateStr), "MMM yyyy");
  } catch {
    return dateStr;
  }
}

/**
 * Format a date range with support for current/ongoing entries
 * @param startDate - Start date string
 * @param endDate - End date string
 * @param isCurrent - Whether the entry is currently ongoing
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  isCurrent: boolean,
): string {
  const start = formatDate(startDate);
  const end = isCurrent ? "Present" : formatDate(endDate);
  return `${start} - ${end}`;
}
