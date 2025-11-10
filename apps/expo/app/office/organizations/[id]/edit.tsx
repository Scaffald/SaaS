import { YStack, Spinner } from '@app/ui'
import { useLocalSearchParams } from 'expo-router'
import { api } from '@app/core/utils/api'
import { OrganizationForm } from '@app/core/features/office/components/OrganizationForm'

export default function EditOrganizationPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return (
      <YStack flex={1} items="center" justify="center">
        <YStack>Invalid organization ID</YStack>
      </YStack>
    )
  }

  const { data, isLoading } = api.office.getOrganization.useQuery({ id }, { enabled: !!id })

  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center">
        <Spinner size="large" />
      </YStack>
    )
  }

  if (!data?.organization) {
    return (
      <YStack flex={1} items="center" justify="center">
        <YStack>Organization not found</YStack>
      </YStack>
    )
  }

  return (
    <OrganizationForm
      mode="edit"
      organizationId={id}
      initialData={{
        name: data.organization.name,
        slug: data.organization.slug,
        industry_id: data.organization.industry_id || undefined,
        logo_url: data.organization.logo_url || undefined,
        visibility: data.organization.visibility || 'public',
        address: data.organization.address || undefined,
        locations: data.organization.locations || [],
      }}
    />
  )
}
