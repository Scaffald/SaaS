import { ProjectForm } from '@scf/core/features/office/projects/components/ProjectForm'
import { useLocalSearchParams } from 'expo-router'

export default function EditProjectPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return null
  }

  return <ProjectForm mode="edit" projectId={id} />
}
