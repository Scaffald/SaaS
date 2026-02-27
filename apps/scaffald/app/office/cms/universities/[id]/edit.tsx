import { ROUTES } from '@scf/core/constants/routes'
import { OfficeUniversitiesForm } from '@scf/core/features/office/office-universities-form'
import { useOfficeUniversity } from '@scf/core/utils/office-universities-sdk-hooks'
import { Spinner, Stack } from '@scaffald/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'

export default function EditUniversityPage() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return (
      <Stack align="center" justify="center">
        <Stack>Invalid university ID</Stack>
      </Stack>
    )
  }

  const { data, isLoading } = useOfficeUniversity(id || undefined, { enabled: !!id })

  if (isLoading) {
    return (
      <Stack align="center" justify="center">
        <Spinner size="lg" />
      </Stack>
    )
  }

  if (!data?.university) {
    return (
      <Stack align="center" justify="center">
        <Stack>University not found</Stack>
      </Stack>
    )
  }

  return (
    <OfficeUniversitiesForm
      selectedUniversity={data.university}
      onUniversitySaved={() => {
        router.push(ROUTES.OFFICE.CMS.UNIVERSITIES.path)
      }}
      onCancel={() => {
        router.back()
      }}
    />
  )
}
