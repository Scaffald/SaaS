/**
 * Which office section and sub-tab a path belongs to. Pure, so the rules
 * can be tested without rendering the layout.
 */

export const isPathActive = (currentPath: string, targetHref: string) => {
  if (!targetHref) return false

  const normalizedCurrent = currentPath.replace(/\/$/, '')
  const normalizedTarget = targetHref.replace(/\/$/, '')

  if (normalizedCurrent === normalizedTarget) {
    return true
  }

  const base = normalizedTarget.split('/:')[0]
  if (!base) {
    return false
  }

  // For top-level office routes, match exact or sub-paths
  if (normalizedTarget.startsWith('/office/')) {
    return normalizedCurrent === base || normalizedCurrent.startsWith(`${base}/`)
  }

  return normalizedCurrent === base || normalizedCurrent.startsWith(`${base}/`)
}

/**
 * The office section the current page belongs to, or none.
 *
 * It used to fall back to the first section — CMS — when nothing matched, so
 * every office page outside a sectioned area (`/office/settings/geographic`,
 * `/office/oauth-apps`) drew CMS's sub-tabs with "Workers" underlined, a
 * navigation strip for somewhere else (#1098).
 */
export function findActiveOfficeSection<T extends { path: string }>(
  currentPath: string,
  sections: T[]
): T | undefined {
  return sections.find((section) => isPathActive(currentPath, section.path))
}

/**
 * The sub-tab a path belongs to: the one whose own path, or one of its
 * `owns` paths, is the longest prefix of it.
 *
 * Request a check (/office/ats/request) and the review queue
 * (/office/ats/admin) are children of Background Checks in the route tree but
 * do not sit under its path, so they matched no tab and the strip fell back to
 * whichever tab came first (#1202).
 */
export function findActiveSubTab<T extends { href: string; owns?: string[] }>(
  currentPath: string,
  items: T[]
): T | undefined {
  let best: T | undefined
  let bestLength = -1
  for (const item of items) {
    for (const path of [item.href, ...(item.owns ?? [])]) {
      if (path.length > bestLength && isPathActive(currentPath, path)) {
        best = item
        bestLength = path.length
      }
    }
  }
  return best
}
