import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useOfficeOrganizations } from '@scf/core/utils/office-organizations-sdk-hooks'
import { ResponsiveSelect, useThemeContext, type ListToolbarFilterChip } from '@scaffald/ui'
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Text, Row } from '@scaffald/ui'
import { OfficePageLayout } from '../components/OfficePageLayout'
import { CellText, type CmsRowAction } from '../components/CmsCells'
import { formatCellDate } from '../cms-format'
import { filterTeamRows, toTeamRow, type TeamRow } from './team-rows'
import { useTeams } from '@scaffald/sdk/react'
import { colors } from '@scaffald/ui/tokens'

const VISIBILITY_LABELS: Record<TeamRow['visibility'], string> = {
  public: 'Public',
  organization: 'Organization',
  private: 'Private',
}

// Every organization gets a "Default Team", so the name alone told eighteen
// rows apart by nothing (#1206). The Organization column says whose it is.
const createColumns = (): ColumnDef<TeamRow, unknown>[] => [
  {
    accessorKey: 'name',
    header: 'Team',
    cell: ({ row }: CellContext<TeamRow, unknown>) => (
      <CellText strong>{row.original.name}</CellText>
    ),
  },
  {
    accessorKey: 'organizationName',
    header: 'Organization',
    cell: ({ row }: CellContext<TeamRow, unknown>) => (
      <CellText>{row.original.organizationName}</CellText>
    ),
    meta: { width: '28%' },
  },
  {
    accessorKey: 'visibility',
    header: 'Visibility',
    cell: ({ row }: CellContext<TeamRow, unknown>) => (
      <CellText>{VISIBILITY_LABELS[row.original.visibility]}</CellText>
    ),
  },
  {
    accessorKey: 'defaultRole',
    header: 'Default role',
    cell: ({ row }: CellContext<TeamRow, unknown>) => (
      <CellText>{row.original.defaultRole}</CellText>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    cell: ({ row }: CellContext<TeamRow, unknown>) => (
      <CellText tabular>{formatCellDate(row.original.updatedAt)}</CellText>
    ),
    meta: { width: 120 },
  },
]

export function OfficeTeamsList() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [organizationFilter, setOrganizationFilter] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useTeams({
    includeArchived: false,
  })
  const { data: organizationsData } = useOfficeOrganizations()

  const organizations = useMemo(
    () =>
      (organizationsData?.organizations ?? []) as Array<{
        id: string
        name: string
      }>,
    [organizationsData?.organizations]
  )

  const organizationNames = useMemo(
    () => new Map(organizations.map((org) => [org.id, org.name])),
    [organizations]
  )

  const teams: TeamRow[] = useMemo(
    () =>
      ((data?.teams ?? []) as unknown as Record<string, unknown>[]).map((team) =>
        toTeamRow(team, organizationNames)
      ),
    [data?.teams, organizationNames]
  )

  const filteredTeams = useMemo(
    () => filterTeamRows(teams, search, organizationFilter),
    [teams, search, organizationFilter]
  )

  // Only the organizations that own a team: a filter option that always
  // returns nothing is a dead end.
  const organizationOptions = useMemo(() => {
    const owning = new Set(teams.map((team) => team.organizationId))
    return organizations
      .filter((org) => owning.has(org.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [organizations, teams])

  const columns = useMemo(() => createColumns(), [])

  const handleRowEdit = (team: TeamRow) => {
    router.push(buildPath(ROUTES.OFFICE.CMS.TEAMS.DETAIL.EDIT, { id: team.id }))
  }

  const rowActions = (team: TeamRow): CmsRowAction[] => [
    {
      label: 'Open',
      onPress: () => router.push(buildPath(ROUTES.OFFICE.CMS.TEAMS.DETAIL, { id: team.id })),
    },
    { label: 'Edit', onPress: () => handleRowEdit(team) },
    // Archive belongs where it can be confirmed, not one tap from a row.
  ]

  const selectedOrganization = organizationFilter
    ? organizationNames.get(organizationFilter)
    : undefined
  const filterChips: ListToolbarFilterChip[] = organizationFilter
    ? [
        {
          id: 'organization',
          label: 'Organization',
          value: selectedOrganization ?? 'Selected',
          active: true,
          onPress: () => {},
          onClear: () => setOrganizationFilter(null),
        },
      ]
    : []

  return (
    <OfficePageLayout
      resultNoun="team"
      wrapWithOfficeLayout
      kicker="Content management"
      title="Teams"
      tip="Every organization starts with a Default Team; filter by organization to see one company’s teams."
      searchPlaceholder="Search teams or organizations…"
      searchValue={search}
      onSearchChange={setSearch}
      createButtonLabel="Create team"
      onCreateClick={() => router.push(ROUTES.OFFICE.CMS.TEAMS.CREATE.path)}
      columns={columns}
      data={filteredTeams}
      isLoading={isLoading}
      loadError={
        error ? { error, retry: () => void refetch(), title: 'Couldn’t load teams' } : undefined
      }
      emptyMessage="No teams found"
      onRowEdit={handleRowEdit}
      rowActions={rowActions}
      getItemName={(team: TeamRow) => team.name}
      itemType="team"
      filterContent={
        <Row gap={8} align="center">
          <Text style={{ color: colors.text[theme].secondary }}>Organization</Text>
          <ResponsiveSelect
            value={organizationFilter ?? 'all'}
            onValueChange={(value: string) => setOrganizationFilter(value === 'all' ? null : value)}
            placeholder="All organizations"
            size="sm"
            options={[
              { value: 'all', label: 'All organizations' },
              ...organizationOptions.map((org) => ({
                value: org.id,
                label: org.name,
              })),
            ]}
          />
        </Row>
      }
      activeFilterCount={organizationFilter ? 1 : 0}
      filterChips={filterChips}
      onClearFilters={organizationFilter ? () => setOrganizationFilter(null) : undefined}
      // No Quick Actions rail (#1099): it repeated the toolbar's Create and a
      // Refresh, and cost the table ~400px, clipping its last column at 1440.
    />
  )
}
