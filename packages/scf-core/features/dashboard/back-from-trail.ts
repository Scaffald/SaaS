import type { BreadcrumbItemData } from '@scaffald/ui'

/**
 * A drill-in's way back, read off the trail it already declares: the parent
 * is the last crumb before this page that links somewhere. A trail of only
 * Dashboard and the page itself is a top-level screen, which gets no back
 * link — the nav already says where you are (#1163).
 */
export const backFromTrail = (
  trail: BreadcrumbItemData[] | undefined
): { label: string; href: string } | null => {
  if (!trail || trail.length < 3) return null
  for (let i = trail.length - 2; i >= 1; i--) {
    const crumb = trail[i]
    if (crumb?.href && crumb.label) return { label: crumb.label, href: crumb.href }
  }
  return null
}
