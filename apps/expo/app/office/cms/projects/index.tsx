import { OfficeProjectsList } from '@app/core/features/office/projects/OfficeProjectsList'
import { OfficeContentLayout } from '@app/core/features/office/components/OfficeContentLayout'
import {
  CMS_ACCORDION_SECTIONS,
  CMS_TABS,
} from '@app/core/features/office/navigation/officeCmsNavigation'

export default function OfficeProjectsPage() {
  return (
    <OfficeContentLayout
      title="Project Management"
      description="Track construction projects with geographic data, site boundaries, and worker assignments."
      tabs={CMS_TABS}
      accordionSections={CMS_ACCORDION_SECTIONS}
      rightContentHeading="Quick Links"
    >
      <OfficeProjectsList showHeader={false} />
    </OfficeContentLayout>
  )
}
