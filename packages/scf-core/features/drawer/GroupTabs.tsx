import type { TranslationKey } from '@scf/core/locales'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { type Href, useRouter } from 'expo-router'
import { Tabs } from '@scaffald/ui'

export type GroupPage = { href: string; titleKey: TranslationKey }

/** A section tab's pages, and which one the current pathname is on. */
export type GroupPages = { pages: GroupPage[]; activeHref: string | null }

/**
 * The row of a section tab's own pages, beneath the section's folder tabs:
 * Admin's Billing (Payments, Transactions, Stripe) and Office's Organizations
 * (Organizations, Teams, Projects, Universities) alike. The folder tab says
 * which group you are in; this row moves between its pages. Each section
 * decides its groups (`admin-groups.ts`, `office-groups.ts`) and wraps this in
 * its own padding.
 */
export function GroupTabs({ group }: { group: GroupPages }) {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <Tabs
      value={group.activeHref ?? ''}
      onValueChange={(href) => router.push(href as Href)}
      type="default"
      orientation="horizontal"
      scrollable
    >
      {group.pages.map((page) => (
        <Tabs.Item key={page.href} value={page.href}>
          <Tabs.Trigger>{t(page.titleKey)}</Tabs.Trigger>
        </Tabs.Item>
      ))}
    </Tabs>
  )
}
