import { ROUTES } from '@app/core/constants/routes'
import { OfficeUniversitiesForm } from '@app/core/features/office/office-universities-form'
import { api } from '@app/core/utils/api'
import { Spinner, YStack } from '@unicornlove/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'

export default function EditUniversityPage() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return (
      <YStack flex={1} items="center" justify="center">
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
      <YStack flex={1} items="center" justify="center">
        <Spinner size="large" />
      </YStack>
    )
  }

  if (!data?.university) {
    return (
      <YStack flex={1} items="center" justify="center">
        <YStack>University not found</YStack>
      </YStack>
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
