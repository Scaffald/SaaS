import { OfficeUsersList } from '@app/core/features/office/office-users-list'
import { OfficeContentLayout } from '@app/core/features/office/components/OfficeContentLayout'
import {
  CMS_ACCORDION_SECTIONS,
  CMS_TABS,
} from '@app/core/features/office/navigation/officeCmsNavigation'

export default function OfficeUsersIndex() {
  return (
    <OfficeContentLayout
      title="User Directory"
      description="View everyone in the organization. Filter, search, and take action quickly."
      tabs={CMS_TABS}
      accordionSections={CMS_ACCORDION_SECTIONS}
      rightContentHeading="Quick Links"
    >
      <OfficeUsersList showHeader={false} />
    </OfficeContentLayout>
  )
}
