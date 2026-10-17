import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useProjects } from '@scf/core/utils/projects-sdk-hooks'
import { useAllOrganizations } from '@scf/core/utils/useAllOrganizations'
import { StatusBadge } from '@scf/core/components/ui'
import { ResponsiveSelect, useThemeContext, type ListToolbarFilterChip } from '@scaffald/ui'
import { Eye, EyeOff } from 'lucide-react-native'
import { type ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Text, Row } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { OfficePageLayout } from '../components/OfficePageLayout'
import { CellText, type CmsRowAction } from '../components/CmsCells'
import { formatCellDate, projectStatus } from '../cms-format'

type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold'

type Project = {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  organization_id: string
  start_date: string | null
  end_date: string | null
  location_visibility: 'public' | 'authenticated' | 'organization_only' | 'private'
  location_visibility_override: boolean
  created_at: string
  updated_at: string
}

/** A row: the project plus its organization's name, resolved once. */
type ProjectRow = Project & { organizationName: string | null }

const columnHelper = createColumnHelper<ProjectRow>()

const VISIBILITY_LABELS: Record<Project['location_visibility'], string> = {
  public: 'Public',
  authenticated: 'Signed-in users',
  organization_only: 'Organization only',
  private: 'Private',
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
]

function VisibilityCell({ project }: { project: ProjectRow }) {
  const { theme } = useThemeContext()
  const visibility = project.location_visibility
  const Icon = visibility === 'public' || visibility === 'authenticated' ? Eye : EyeOff
  return (
    <Row gap={6} align="center" style={{ minWidth: 0 }}>
      <Icon size={14} color={colors.text[theme].tertiary} />
      <CellText>
        {project.location_visibility_override
          ? `${VISIBILITY_LABELS[visibility] ?? visibility} (override)`
          : (VISIBILITY_LABELS[visibility] ?? visibility)}
      </CellText>
    </Row>
  )
}

const createColumns = () => [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => <CellText strong>{info.getValue()}</CellText>,
    meta: { width: '30%' },
  }),
  // The cards printed the raw organization_id here (#1205).
  columnHelper.accessor('organizationName', {
    header: 'Organization',
    cell: (info) => <CellText>{info.getValue()}</CellText>,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = projectStatus(info.getValue())
      return <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
    },
    meta: { width: 112 },
  }),
  columnHelper.accessor('location_visibility', {
    header: 'Location visibility',
    cell: (info) => <VisibilityCell project={info.row.original} />,
  }),
  columnHelper.accessor('updated_at', {
    header: 'Updated',
    cell: (info) => (
      <CellText tabular>{formatCellDate(info.getValue() ?? info.row.original.created_at)}</CellText>
    ),
    meta: { width: 120 },
  }),
]

/**
 * The CMS Projects list. It was the one CMS screen that was not a table: a
 * column of bordered cards under two loose dropdowns with no search, and its
 * own filled Create at the end of the filter row (#1205, #1209). It now opens
 * like every other CMS list — header with Create, one toolbar, a table.
 */
export function OfficeProjectsList({ showHeader = true }: { showHeader?: boolean }) {
  const { theme } = useThemeContext()
  const router = useRouter()
  const { data: organizationsData } = useAllOrganizations()
  const [search, setSearch] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | null>(null)

  const { data, isLoading, error, refetch } = useProjects({
    organizationId: selectedOrg || undefined,
    status: statusFilter || undefined,
    limit: 50,
    offset: 0,
  })

  const organizations = useMemo(
    () =>
      (
        (organizationsData?.organizations ?? []) as Array<{
          id: string
          name: string
        }>
      )
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [organizationsData?.organizations]
  )
  const organizationNames = useMemo(
    () => new Map(organizations.map((org) => [org.id, org.name])),
    [organizations]
  )

  const rows: ProjectRow[] = useMemo(() => {
    const projects = (data?.projects ?? []) as Project[]
    const query = search.trim().toLowerCase()
    return projects
      .map((project) => ({
        ...project,
        organizationName: organizationNames.get(project.organization_id) ?? null,
      }))
      .filter(
        (project) =>
          !query ||
          project.name.toLowerCase().includes(query) ||
          (project.organizationName ?? '').toLowerCase().includes(query)
      )
  }, [data?.projects, organizationNames, search])

  const columns = useMemo(() => createColumns(), [])

  const handleRowEdit = (project: ProjectRow) => {
    router.push(buildPath(ROUTES.OFFICE.CMS.PROJECTS.DETAIL.EDIT, { id: project.id }))
  }

  const rowActions = (project: ProjectRow): CmsRowAction[] => [
    {
      label: 'Open',
      onPress: () => router.push(buildPath(ROUTES.OFFICE.CMS.PROJECTS.DETAIL, { id: project.id })),
    },
    { label: 'Edit', onPress: () => handleRowEdit(project) },
  ]

  const filterChips: ListToolbarFilterChip[] = [
    ...(selectedOrg
      ? [
          {
            id: 'organization',
            label: 'Organization',
            value: organizationNames.get(selectedOrg) ?? 'Selected',
            active: true,
            onPress: () => {},
            onClear: () => setSelectedOrg(null),
          },
        ]
      : []),
    ...(statusFilter
      ? [
          {
            id: 'status',
            label: 'Status',
            value: projectStatus(statusFilter).label,
            active: true,
            onPress: () => {},
            onClear: () => setStatusFilter(null),
          },
        ]
      : []),
  ]

  const filterContent = (
    <Row gap={12} align="center" wrap>
      <Row gap={8} align="center">
        <Text style={{ color: colors.text[theme].secondary }}>Organization</Text>
        <ResponsiveSelect
          value={selectedOrg ?? 'all'}
          onValueChange={(value: string) => setSelectedOrg(value === 'all' ? null : value)}
          placeholder="All organizations"
          size="sm"
          options={[
            { value: 'all', label: 'All organizations' },
            ...organizations.map((org) => ({ value: org.id, label: org.name })),
          ]}
        />
      </Row>
      <Row gap={8} align="center">
        <Text style={{ color: colors.text[theme].secondary }}>Status</Text>
        <ResponsiveSelect
          value={statusFilter ?? 'all'}
          onValueChange={(value: string) =>
            setStatusFilter(value === 'all' ? null : (value as ProjectStatus))
          }
          placeholder="All statuses"
          size="sm"
          options={[{ value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS]}
        />
      </Row>
    </Row>
  )

  return (
    <OfficePageLayout
      resultNoun="project"
      wrapWithOfficeLayout
      kicker="Content management"
      title="Projects"
      tip="Construction projects by organization. Location visibility decides who can see where a project is."
      searchPlaceholder="Search projects or organizations…"
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create project"
      onCreateClick={() => router.push(ROUTES.OFFICE.CMS.PROJECTS.CREATE.path)}
      columns={columns as ColumnDef<ProjectRow, unknown>[]}
      data={rows}
      isLoading={isLoading}
      loadError={
        error
          ? {
              error,
              retry: () => void refetch(),
              title: 'Couldn’t load projects',
            }
          : undefined
      }
      pageSize={50}
      emptyMessage="No projects found"
      hideHeader={!showHeader}
      onRowEdit={handleRowEdit}
      rowActions={rowActions}
      getItemName={(project: ProjectRow) => project.name}
      itemType="project"
      filterContent={filterContent}
      activeFilterCount={(selectedOrg ? 1 : 0) + (statusFilter ? 1 : 0)}
      filterChips={filterChips}
      onClearFilters={
        selectedOrg || statusFilter
          ? () => {
              setSelectedOrg(null)
              setStatusFilter(null)
            }
          : undefined
      }
      // No Quick Actions rail (#1099): it repeated the toolbar's Create and a
      // Refresh, and cost the table ~400px, clipping its last column at 1440.
    />
  )
}
