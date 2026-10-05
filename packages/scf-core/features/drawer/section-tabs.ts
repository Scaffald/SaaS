import type { DrawerItemConfig } from './types'
import { isActivePath } from './utils'

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

const owns = (item: DrawerItemConfig, pathname: string): boolean =>
  item.matchPrefix
    ? pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`)
    : isActivePath(pathname, item.href, item.exact)

/**
 * Walks down from `items` to the deepest item that both owns `pathname` and
 * has children of its own. An organisation under Employers is such an item:
 * on `/employers/org/acme/teams` the tabs are that org's, not Employers'.
 */
const findOwner = (items: DrawerItemConfig[], pathname: string): DrawerItemConfig | null => {
  for (const item of items) {
    if (!item.subItems?.length) continue
    if (!isActivePath(pathname, item.href)) continue
    return findOwner(item.subItems, pathname) ?? item
  }
  return null
}

/** The tab that owns the pathname — the most specific one when several do. */
const pickActive = (tabs: DrawerItemConfig[], pathname: string): string | null => {
  let best: DrawerItemConfig | null = null
  for (const tab of tabs) {
    if (!owns(tab, pathname)) continue
    if (!best || tab.href.length > best.href.length) best = tab
  }
  return best?.key ?? null
}

export function getSectionTabs(
  pathname: string,
  items: DrawerItemConfig[]
): SectionTabStrip | null {
  const section = items.find((item) => isActivePath(pathname, item.href, item.exact))
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
