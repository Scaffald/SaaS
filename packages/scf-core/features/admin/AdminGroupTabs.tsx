import { useScreenRhythm } from '@scf/core/constants/layout'
import { usePathname } from '@scf/core/utils/usePathname'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { type Href, useRouter } from 'expo-router'
import { Row, Tabs } from '@scaffald/ui'
import { adminGroupPages } from './admin-groups'

/**
 * The row of a multi-page Admin tab's pages (Billing, Integrations, System),
 * above the page itself. Nothing for a tab with one page.
 */
export function AdminGroupTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const { gutter, verticalPadding } = useScreenRhythm()
  const group = adminGroupPages(pathname)

  if (!group) return null

  return (
    <Row paddingHorizontal={gutter} paddingTop={verticalPadding}>
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
    </Row>
  )
}
