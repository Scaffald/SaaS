import { YStack, Spinner, Text } from '@app/ui'
import { useLocalSearchParams } from 'expo-router'
import { api } from '@app/core/utils/api'
import { UserForm } from '@app/core/features/office/components/UserForm'

export default function EditUserPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data, isLoading } = api.office.getUser.useQuery({ id: id! }, { enabled: !!id })

  if (isLoading) {
    return (
      <YStack flex={1} bg="$background" items="center" justify="center">
        <Spinner size="large" />
      </YStack>
    )
  }

  if (!data?.profile) {
    return (
      <YStack flex={1} bg="$background" items="center" justify="center">
        <Text>User not found</Text>
      </YStack>
    )
  }

  return (
    <UserForm
      userId={id!}
      initialProfile={{
        first_name: data.profile.first_name,
        last_name: data.profile.last_name,
        display_name: data.profile.display_name,
        bio: data.profile.bio,
      }}
      initialPrivateData={
        data.privateData
          ? {
              email: data.privateData.email,
              phone_number: data.privateData.phone_number,
              birth_date: data.privateData.birth_date,
              location: data.privateData.location,
              employment_status: data.privateData.employment_status,
              job_search_status: data.privateData.job_search_status,
              years_of_experience: data.privateData.years_of_experience,
              current_title: data.privateData.current_title,
              current_employer: data.privateData.current_employer,
            }
          : null
      }
    />
  )
}
