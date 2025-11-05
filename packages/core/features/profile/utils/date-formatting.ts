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
 * @param expectedGraduationDate - Expected graduation date for current education
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  isCurrent: boolean,
  expectedGraduationDate?: string | null | undefined,
): string {
  const start = formatDate(startDate);
  if (isCurrent) {
    const expected = expectedGraduationDate ? formatDate(expectedGraduationDate) : null;
    return expected 
      ? `${start} - Present (Expected: ${expected})`
      : `${start} - Present`;
  }
  const end = formatDate(endDate);
  return `${start} - ${end}`;
}
