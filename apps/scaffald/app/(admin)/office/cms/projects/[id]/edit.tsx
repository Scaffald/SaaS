import { CmsFormPage } from '@scf/core/features/office/components/CmsFormPage'
import { ProjectForm } from '@scf/core/features/office/projects/components/ProjectForm'
import { useLocalSearchParams } from 'expo-router'

function EditProjectPageContent() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return null
  }

  return <ProjectForm mode="edit" projectId={id} />
}

// One shell for every CMS form (#1098): office gutter, ScreenHeader, one column.
export default function EditProjectPage() {
  return (
    <CmsFormPage title="Edit project">
      <EditProjectPageContent />
    </CmsFormPage>
  )
}
