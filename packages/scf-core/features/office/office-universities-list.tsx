import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { Text } from '@unicornlove/beyond-ui'
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { OfficePageLayout } from './components/OfficePageLayout'
import { QuickActionsWidget } from './components/QuickActionsWidget'

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

const createColumns = () => [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => <Text ellipsizeMode="tail">{info.getValue()}</Text>,
  }),
  columnHelper.accessor('country', {
    header: 'Country',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('state_province', {
    header: 'State/Province',
    cell: (info) => info.getValue() || '-',
  }),
  // Actions column removed - using RowActionOverlay instead
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
  const columns = createColumns()

  const handleRowEdit = (university: University) => {
    router.push(buildPath(ROUTES.OFFICE.CMS.UNIVERSITIES.EDIT, { id: university.id }))
  }

  const handleRowDelete = async (university: University) => {
    await handleDelete(university.id)
  }

  const getItemName = (university: University) => university.name

  return (
    <OfficePageLayout
      wrapWithOfficeLayout
      showBreadcrumb
      title="Universities"
      searchPlaceholder="Search universities..."
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create University"
      onCreateClick={() => router.push(ROUTES.OFFICE.CMS.UNIVERSITIES.CREATE.path)}
      columns={columns as ColumnDef<University, unknown>[]}
      data={universities}
      isLoading={isLoading}
      pageSize={50}
      emptyMessage="No universities found"
      onRowEdit={handleRowEdit}
      onRowDelete={handleRowDelete}
      getItemName={getItemName}
      itemType="university"
      rightContent={
        <QuickActionsWidget
          context="list"
          resourceName="University"
          onCreate={() => router.push(ROUTES.OFFICE.CMS.UNIVERSITIES.CREATE.path)}
          onRefresh={() => refetch()}
          isLoading={isLoading}
        />
      }
    />
  )
}
