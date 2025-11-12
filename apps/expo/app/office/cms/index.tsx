import { OfficeContentLayout } from '@app/core/features/office/components/OfficeContentLayout'
import { OfficeUsersList } from '@app/core/features/office/office-users-list'
import {
  CMS_ACCORDION_SECTIONS,
  CMS_TABS,
} from '@app/core/features/office/navigation/officeCmsNavigation'

export default function OfficeCmsIndexPage() {
  return (
    <OfficeContentLayout
      title="Manage Users"
      description="Review and manage users across your organization. Use quick links to jump directly into people workflows."
      tabs={CMS_TABS}
      accordionSections={CMS_ACCORDION_SECTIONS}
      rightContentHeading="Quick Links"
    >
      <OfficeUsersList showHeader={false} />
    </OfficeContentLayout>
  )
}
