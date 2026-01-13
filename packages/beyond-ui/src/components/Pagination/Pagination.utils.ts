/**
 * Utility functions for Pagination component
 */

/**
 * Generates an array of page numbers and ellipsis markers for pagination display
 *
 * @param currentPage - The currently active page (1-indexed)
 * @param totalPages - Total number of pages
 * @param siblingCount - Number of pages to show on each side of current page (default: 1)
 * @param boundaryCount - Number of pages to always show at start and end (default: 1)
 * @returns Array of page numbers and 'ellipsis' markers
 *
 * @example
 * generatePageItems(5, 10, 1, 1)
 * // Returns: [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]
 *
 * @example
 * generatePageItems(1, 5, 1, 1)
 * // Returns: [1, 2, 3, 'ellipsis', 5]
 */
export function generatePageItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1,
  boundaryCount: number = 1
): (number | 'ellipsis')[] {
  // Helper to generate range of numbers
  const range = (start: number, end: number): number[] => {
    const length = end - start + 1
    return Array.from({ length }, (_, i) => start + i)
  }

  // Handle edge case: single page
  if (totalPages === 1) {
    return [1]
  }

  // Calculate start and end pages (boundary pages)
  const startPages = range(1, Math.min(boundaryCount, totalPages))
  const endPages = range(
    Math.max(totalPages - boundaryCount + 1, boundaryCount + 1),
    totalPages
  )

  // Calculate sibling pages around current page
  const siblingsStart = Math.max(
    Math.min(
      currentPage - siblingCount,
      // Don't go past the point where siblings would overlap with end pages
      totalPages - boundaryCount - siblingCount * 2 - 1
    ),
    // Don't overlap with start pages
    boundaryCount + 2
  )

  const siblingsEnd = Math.min(
    Math.max(
      currentPage + siblingCount,
      // Don't go before the point where siblings would overlap with start pages
      boundaryCount + siblingCount * 2 + 2
    ),
    // Don't overlap with end pages
    totalPages - boundaryCount - 1
  )

  // Build the items array with ellipsis where needed
  const itemList: (number | 'ellipsis')[] = [
    // Start boundary pages
    ...startPages,

    // Left ellipsis (if there's a gap between start pages and siblings)
    ...(siblingsStart > boundaryCount + 2
      ? ['ellipsis' as const]
      : boundaryCount + 1 < totalPages - boundaryCount
        ? [boundaryCount + 1]
        : []),

    // Sibling pages around current
    ...range(siblingsStart, siblingsEnd),

    // Right ellipsis (if there's a gap between siblings and end pages)
    ...(siblingsEnd < totalPages - boundaryCount - 1
      ? ['ellipsis' as const]
      : totalPages - boundaryCount > boundaryCount
        ? [totalPages - boundaryCount]
        : []),

    // End boundary pages
    ...endPages,
  ]

  // Remove duplicates while preserving order
  // This handles cases where ranges overlap
  return itemList.filter((item, index, array) => array.indexOf(item) === index)
}
