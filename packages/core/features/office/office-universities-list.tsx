import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Button, Text } from '@app/ui'
import { XStack } from 'tamagui'
import { api } from '@app/core/utils/api'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { Pencil } from '@tamagui/lucide-icons'
import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import { OfficePageLayout } from './components/OfficePageLayout'
import { DeleteButton } from './components/DeleteButton'

type University = {
  id: string
  name: string
  slug: string
  country: string
  alpha_two_code: string
  state_province: string | null
  domains: string[]
  web_pages: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

const columnHelper = createColumnHelper<University>()

const createColumns = (
  router: ReturnType<typeof useRouter>,
  onDelete: (id: string) => Promise<void>
) => [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <Text numberOfLines={1} ellipsizeMode="tail">
        {info.getValue()}
      </Text>
    ),
  }),
  columnHelper.accessor('country', {
    header: 'Country',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('state_province', {
    header: 'State/Province',
    cell: (info) => info.getValue() || '-',
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: (info) => {
      const university = info.row.original
      return (
        <XStack gap="$2">
          <Button
            data-testid={`university-edit-button-${university.id}`}
            size="$2"
            variant="outlined"
            icon={Pencil}
            onPress={() => router.push(RouteBuilder.officeUniversitiesEdit(university.id))}
          >
            Edit
          </Button>
          <DeleteButton
            data-testid={`university-delete-button-${university.id}`}
            itemName={university.name}
            itemType="university"
            onDelete={() => onDelete(university.id)}
          />
        </XStack>
      )
    },
  }),
]

export function OfficeUniversitiesList() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch } = api.office.universities.getUniversities.useQuery({
    page: 1,
    pageSize: 100,
    search: search || undefined,
    sortBy: 'name',
    sortOrder: 'asc',
  })

  const deleteMutation = api.office.universities.deleteUniversity.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id })
  }

  const universities = data?.universities ?? []
  const columns = createColumns(router, handleDelete)

  return (
    <OfficePageLayout
      title="Universities"
      searchPlaceholder="Search universities..."
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create University"
      onCreateClick={() => router.push(ROUTES.OFFICE_UNIVERSITIES_CREATE.path)}
      columns={columns as ColumnDef<University, unknown>[]}
      data={universities}
      isLoading={isLoading}
      pageSize={50}
      emptyMessage="No universities found"
    />
  )
}
