import { OrganizationForm } from '@app/core/features/office/components/OrganizationForm'
import { api } from '@app/core/utils/api'
import { Spinner, YStack } from '@unicornlove/ui'
import { useLocalSearchParams } from 'expo-router'

export default function EditOrganizationPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <YStack>Invalid organization ID</YStack>
      </YStack>
    )
  }

  const { data, isLoading } = api.office.getOrganization.useQuery({ id }, { enabled: !!id })

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </YStack>
    )
  }

  if (!data?.organization) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <YStack>Organization not found</YStack>
      </YStack>
    )
  }

  return (
    <OrganizationForm
      mode="edit"
      organizationId={id}
      initialData={{
        address: data.organization.address || undefined,
        industry_id: data.organization.industry_id || undefined,
        locations: data.organization.locations || [],
        logo_url: data.organization.logo_url || undefined,
        name: data.organization.name,
        slug: data.organization.slug,
        visibility: data.organization.visibility || 'public',
      }}
    />
  )
}
