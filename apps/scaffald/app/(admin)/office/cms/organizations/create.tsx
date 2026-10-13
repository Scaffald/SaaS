import { CmsFormPage } from '@scf/core/features/office/components/CmsFormPage'
import { OrganizationForm } from '@scf/core/features/office/components/OrganizationForm'

function CreateOrganizationPageContent() {
  return <OrganizationForm mode="create" />
}

// One shell for every CMS form (#1098): office gutter, ScreenHeader, one column.
export default function CreateOrganizationPage() {
  return (
    <CmsFormPage
      title="New organization"
      tip="An employer on Scaffald, with its own jobs, teams and projects."
    >
      <CreateOrganizationPageContent />
    </CmsFormPage>
  )
}
