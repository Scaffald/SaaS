import { CmsFormPage } from '@scf/core/features/office/components/CmsFormPage'
import { OfficeUniversitiesForm } from '@scf/core/features/office/office-universities-form'

function CreateUniversityPageContent() {
  return (
    <OfficeUniversitiesForm
      onUniversitySaved={() => {
        // Navigation handled by form component
      }}
      onCancel={() => {
        // Navigation handled by form component
      }}
    />
  )
}

// One shell for every CMS form (#1098): office gutter, ScreenHeader, one column.
export default function CreateUniversityPage() {
  return (
    <CmsFormPage title="New university" tip="A school workers can list in their education.">
      <CreateUniversityPageContent />
    </CmsFormPage>
  )
}
