import { api } from '@app/core/utils/api'
import { ROUTES } from '@app/core/constants/routes'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Button, XStack } from 'tamagui'
import { Pencil } from '@tamagui/lucide-icons'
import { OfficePageLayout } from './components/OfficePageLayout'
import { DeleteButton } from './components/DeleteButton'

type Organization = {
  id: string
  name: string
  slug: string
  industry_id: string | null
  industry_name: string | null
  logo_url: string | null
  visibility: string
  owner_user_id: string | null
  created_at: string
  updated_at: string
}

const columnHelper = createColumnHelper<Organization>()

const createColumns = (
  router: ReturnType<typeof useRouter>,
  onDelete: (id: string) => Promise<void>
) => [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('slug', {
    header: 'Slug',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('industry_name', {
    header: 'Industry',
    cell: (info) => info.getValue() || '-',
  }),
  columnHelper.accessor('visibility', {
    header: 'Visibility',
    cell: (info) => {
      const visibility = info.getValue()
      return visibility.charAt(0).toUpperCase() + visibility.slice(1)
    },
  }),
  columnHelper.accessor('created_at', {
    header: 'Created',
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: (info) => {
      const org = info.row.original
      return (
        <XStack gap="$2">
          <Button
            data-testid={`org-edit-button-${org.id}`}
            size="$2"
            variant="outlined"
            icon={Pencil}
            onPress={() => router.push(`/office/organizations/${org.id}/edit`)}
          >
            Edit
          </Button>
          <DeleteButton
            data-testid={`org-delete-button-${org.id}`}
            itemName={org.name}
            itemType="organization"
            onDelete={() => onDelete(org.id)}
          />
        </XStack>
      )
    },
  }),
]

export function OfficeOrganizationsList() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch } = api.office.listOrganizations.useQuery({
    limit: 50,
    offset: 0,
  })

  const deleteMutation = api.office.deleteOrganization.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id })
  }

  const organizations = data?.organizations ?? []
  const filteredOrganizations = organizations.filter(
    (org: Organization) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase())
  )

  const columns = createColumns(router, handleDelete)

  return (
    <OfficePageLayout
      title="Organizations"
      searchPlaceholder="Search organizations..."
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create Organization"
      onCreateClick={() => router.push('/office/organizations/create')}
      columns={columns as ColumnDef<Organization, unknown>[]}
      data={filteredOrganizations}
      isLoading={isLoading}
      pageSize={50}
      emptyMessage="No organizations found"
      tableTestId="organizations-table"
    />
  )
}
