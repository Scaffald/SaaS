import { OrganizationForm } from '@scf/core/features/office/components/OrganizationForm'
import { api } from '@scf/core/utils/api'
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

  const { data, isLoading } = api.office.getOrganization.useQuery({ id }, { enabled: !!id })

  if (isLoading) {
    return (
      <Stack align="center" justify="center">
        <Spinner size="lg" />
      </Stack>
    )
  }

  if (!data?.organization) {
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
