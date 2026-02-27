import { OrganizationForm } from '@scf/core/features/office/components/OrganizationForm'
import { useOrganization } from '@scf/core/utils/organizations-sdk-hooks'
import { Spinner, Stack } from '@scaffald/ui'
import { useLocalSearchParams } from 'expo-router'

export default function EditOrganizationPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return (
      <Stack align="center" justify="center">
        <Stack>Invalid organization ID</Stack>
      </Stack>
    )
  }

  const { data, isLoading } = useOrganization(id || undefined, { enabled: !!id })

  if (isLoading) {
    return (
      <Stack align="center" justify="center">
        <Spinner size="lg" />
      </Stack>
    )
  }

  if (!data) {
    return (
      <Stack align="center" justify="center">
        <Stack>Organization not found</Stack>
      </Stack>
    )
  }

  return (
    <OrganizationForm
      mode="edit"
      organizationId={id}
      initialData={{
        address: data.address || undefined,
        industry_id: data.industry_id || undefined,
        locations: [],
        logo_url: data.logo_url || undefined,
        name: data.name,
        slug: data.slug,
        visibility: (data.visibility === 'private' ? 'private' : 'public') as 'public' | 'private',
      }}
    />
  )
}
