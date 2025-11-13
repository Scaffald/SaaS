import { useLocalSearchParams } from 'expo-router'
import { ProjectForm } from '@app/core/features/office/projects/components/ProjectForm'

export default function EditProjectPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return null
  }

  return <ProjectForm mode="edit" projectId={id} />
}
