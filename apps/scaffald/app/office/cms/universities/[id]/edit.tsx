import { ROUTES } from '@scf/core/constants/routes'
import { OfficeUniversitiesForm } from '@scf/core/features/office/office-universities-form'
import { api } from '@scf/core/utils/api'
import { Spinner, Stack } from '@unicornlove/beyond-ui'
import { useLocalSearchParams, useRouter } from 'expo-router'

export default function EditUniversityPage() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return (
      <Stack flex={1} align="center" justify="center">
        <Stack>Invalid university ID</Stack>
      </Stack>
    )
  }

  const { data, isLoading } = api.office.universities.getUniversity.useQuery(
    { id },
    { enabled: !!id }
  )

  if (isLoading) {
    return (
      <Stack flex={1} align="center" justify="center">
        <Spinner size="lg" />
      </Stack>
    )
  }

  if (!data?.university) {
    return (
      <Stack flex={1} align="center" justify="center">
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
