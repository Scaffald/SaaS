import { YStack, Spinner } from '@app/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'
import { OfficeUniversitiesForm } from '@app/core/features/office/office-universities-form'

export default function EditUniversityPage() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return (
      <YStack flex={1} bg="$background" items="center" justify="center">
        <YStack>Invalid university ID</YStack>
      </YStack>
    )
  }

  const { data, isLoading } = api.office.universities.getUniversity.useQuery(
    { id },
    { enabled: !!id }
  )

  if (isLoading) {
    return (
      <YStack flex={1} bg="$background" items="center" justify="center">
        <Spinner size="large" />
      </YStack>
    )
  }

  if (!data?.university) {
    return (
      <YStack flex={1} bg="$background" items="center" justify="center">
        <YStack>University not found</YStack>
      </YStack>
    )
  }

  return (
    <OfficeUniversitiesForm
      selectedUniversity={data.university}
      onUniversitySaved={() => {
        router.push(ROUTES.OFFICE_UNIVERSITIES.path)
      }}
      onCancel={() => {
        router.back()
      }}
    />
  )
}
