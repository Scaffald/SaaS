import type { DrawerItemConfig } from './types'
import { activeNavKey } from './config'
import { ownsPath } from './utils'

/**
 * A section's tab strip, resolved from the nav config for one pathname.
 *
 * The drawer lists only the top-level sections. What used to be each
 * section's nested sub-items in the drawer is now a strip of folder tabs
 * across the top of that section's screens (the SCF prototype's
 * arrangement: nav owns the column, tabs own the section). The config is the
 * same tree; this is the other reading of it.
 */
export type SectionTab = Pick<DrawerItemConfig, 'key' | 'title' | 'titleKey' | 'href'>

export type SectionTabStrip = {
  /** The item whose children are the tabs — a section, or an org inside one. */
  ownerKey: string
  tabs: SectionTab[]
  /** The tab that owns `pathname`, or null on a page none of them claims. */
  activeKey: string | null
}

/**
 * Walks down from `items` to the deepest item that both owns `pathname` and
 * has children of its own. An organisation under Employers is such an item:
 * on `/employers/org/acme/teams` the tabs are that org's, not Employers'.
 */
const findOwner = (items: DrawerItemConfig[], pathname: string): DrawerItemConfig | null => {
  for (const item of items) {
    if (!item.subItems?.length) continue
    if (!ownsPath({ href: item.href, matchPrefix: item.matchPrefix }, pathname)) continue
    return findOwner(item.subItems, pathname) ?? item
  }
  return null
}

const underPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`)

/**
 * How specifically `tab` claims `pathname`: the length of the longest prefix
 * it owns that the pathname sits under, or -1 when it does not own it at all.
 */
const claimLength = (tab: DrawerItemConfig, pathname: string): number => {
  let best = ownsPath(tab, pathname) ? (tab.matchPrefix ?? tab.href).length : -1
  for (const prefix of tab.alsoOwns ?? []) {
    if (underPrefix(pathname, prefix)) best = Math.max(best, prefix.length)
  }
  return best
}

/**
 * The tab that owns the pathname, by longest-prefix match: on a sub-route
 * every tab whose prefix it sits under is a candidate, and the most specific
 * one wins — so `/assessments/ipip/results` lights the IPIP tab, not the
 * Assessments index, and a background check lights Verification (#1120).
 */
const pickActive = (tabs: DrawerItemConfig[], pathname: string): string | null => {
  let best: DrawerItemConfig | null = null
  let bestLength = -1
  for (const tab of tabs) {
    const length = claimLength(tab, pathname)
    if (length > bestLength) {
      best = tab
      bestLength = length
    }
  }
  return best?.key ?? null
}

export function getSectionTabs(
  pathname: string,
  items: DrawerItemConfig[]
): SectionTabStrip | null {
  // The page's section is the one top-level item that owns it most
  // specifically — in employer mode /office/applications is the employer's
  // Applications, not Office, so it gets no admin tab strip (#1157).
  const sectionKey = activeNavKey(items, pathname)
  const section = items.find((item) => item.key === sectionKey)
  if (!section?.subItems?.length) return null

  const owner = findOwner(section.subItems, pathname)
  if (!owner) {
    return {
      ownerKey: section.key,
      tabs: section.subItems,
      activeKey: pickActive(section.subItems, pathname),
    }
  }

  // A nested owner's own page is its first tab, so the strip has a way back
  // to it; its children follow.
  const tabs: DrawerItemConfig[] = [
    { key: owner.key, title: owner.title, titleKey: owner.titleKey, href: owner.href, exact: true },
    ...(owner.subItems ?? []),
  ]
  return { ownerKey: owner.key, tabs, activeKey: pickActive(tabs, pathname) }
}

/**
 * Which edges of a sideways-scrolling tab strip hide more tabs. A strip that
 * overflowed gave no sign of it at 390px — Assessments cut "Career inter…"
 * mid-label with nothing to say the row scrolled (#1120) — so each edge with
 * tabs beyond it gets a fade. One pixel of slack absorbs sub-pixel layout.
 */
export function stripEdgeFades(
  offsetX: number,
  contentWidth: number,
  viewportWidth: number
): { start: boolean; end: boolean } {
  if (viewportWidth <= 0 || contentWidth <= viewportWidth + 1) return { start: false, end: false }
  return {
    start: offsetX > 1,
    end: offsetX + viewportWidth < contentWidth - 1,
  }
}

/**
 * Where to scroll a strip so its active tab is on screen, or null when it
 * already is. On a sub-route deep in a long strip (Occupation preferences,
 * Career explorer) the lit tab sat past the right edge, so the page looked as
 * if no tab owned it. The tab lands one gutter from the leading edge.
 */
export function stripScrollTarget(
  tab: { x: number; width: number },
  viewportWidth: number,
  gutter: number
): number | null {
  if (viewportWidth <= 0) return null
  if (tab.x + tab.width <= viewportWidth - gutter) return null
  return Math.max(0, tab.x - gutter)
}
