import { CmsFormPage } from '@scf/core/features/office/components/CmsFormPage'
import { ProjectForm } from '@scf/core/features/office/projects/components/ProjectForm'

function CreateProjectPageContent() {
  return <ProjectForm mode="create" />
}

// One shell for every CMS form (#1098): office gutter, ScreenHeader, one column.
export default function CreateProjectPage() {
  return (
    <CmsFormPage title="New project" tip="A construction project your organization staffs.">
      <CreateProjectPageContent />
    </CmsFormPage>
  )
}
