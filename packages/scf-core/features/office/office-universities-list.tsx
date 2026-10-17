import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useOfficeUniversities } from '@scf/core/utils/office-universities-sdk-hooks'
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { OfficePageLayout } from './components/OfficePageLayout'
import { CellText, type CmsRowAction } from './components/CmsCells'

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
    cell: (info) => <CellText strong>{info.getValue()}</CellText>,
    meta: { width: '45%' },
  }),
  columnHelper.accessor('country', {
    header: 'Country',
    cell: (info) => <CellText>{info.getValue()}</CellText>,
  }),
  columnHelper.accessor('state_province', {
    header: 'State / province',
    cell: (info) => <CellText>{info.getValue()}</CellText>,
  }),
  // Actions column removed - using RowActionOverlay instead
]

export function OfficeUniversitiesList() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useOfficeUniversities({
    page: 1,
    pageSize: 100,
    search: search || undefined,
    sortBy: 'name',
    sortOrder: 'asc',
  })

  const universities = data?.universities ?? []
  const columns = createColumns()

  const handleRowEdit = (university: University) => {
    router.push(buildPath(ROUTES.OFFICE.CMS.UNIVERSITIES.EDIT, { id: university.id }))
  }

  const rowActions = (university: University): CmsRowAction[] => [
    { label: 'Edit', onPress: () => handleRowEdit(university) },
  ]

  const getItemName = (university: University) => university.name

  return (
    <OfficePageLayout
      resultNoun="university"
      resultNounPlural="universities"
      wrapWithOfficeLayout
      kicker="Content management"
      title="Universities"
      tip="The schools a worker can pick for their education history."
      searchPlaceholder="Search universities…"
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create university"
      onCreateClick={() => router.push(ROUTES.OFFICE.CMS.UNIVERSITIES.CREATE.path)}
      columns={columns as ColumnDef<University, unknown>[]}
      data={universities as University[]}
      isLoading={isLoading}
      loadError={
        error
          ? {
              error,
              retry: () => void refetch(),
              title: 'Couldn’t load universities',
            }
          : undefined
      }
      pageSize={50}
      emptyMessage="No universities found"
      onRowEdit={handleRowEdit}
      rowActions={rowActions}
      getItemName={getItemName}
      itemType="university"
      // No Quick Actions rail (#1099): it repeated the toolbar's Create and a
      // Refresh, and cost the table ~400px, clipping its last column at 1440.
    />
  )
}
