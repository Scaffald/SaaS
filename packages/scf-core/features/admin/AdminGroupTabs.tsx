import { useScreenRhythm } from '@scf/core/constants/layout'
import { GroupTabs } from '@scf/core/features/drawer/GroupTabs'
import { usePathname } from '@scf/core/utils/usePathname'
import { Row } from '@scaffald/ui'
import { adminGroupPages } from './admin-groups'

/**
 * The row of a multi-page Admin tab's pages (Billing, Integrations, System),
 * above the page itself. Nothing for a tab with one page.
 */
export function AdminGroupTabs() {
  const pathname = usePathname()
  const { gutter, verticalPadding } = useScreenRhythm()
  const group = adminGroupPages(pathname)

  if (!group) return null

  return (
    <Row paddingHorizontal={gutter} paddingTop={verticalPadding}>
      <GroupTabs group={group} />
    </Row>
  )
}
