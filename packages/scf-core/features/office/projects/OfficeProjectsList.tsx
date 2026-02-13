import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useProjects } from '@scf/core/utils/projects-sdk-hooks'
import { useAllOrganizations } from '@scf/core/utils/useAllOrganizations'
import { OfficeLayout } from '@scf/core/components/layouts'
import { ResponsiveSelect, useThemeContext } from '@scaffald/ui'
import { Eye, EyeOff, Pencil } from 'lucide-react-native'
import { createColumnHelper } from '@tanstack/react-table'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Button, H2, Text, Row, Stack } from '@scaffald/ui'
import { QuickActionsWidget } from '../components/QuickActionsWidget'
import { colors } from '@scaffald/ui/tokens'

type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold'

type Project = {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  location_visibility: 'public' | 'authenticated' | 'organization_only' | 'private'
  location_visibility_override: boolean
  created_at: string
  updated_at: string
  organization: {
    id: string
    name: string
    slug: string
  } | null
}

const columnHelper = createColumnHelper<Project>()

const getVisibilityIcon = (visibility: Project['location_visibility']) => {
  switch (visibility) {
    case 'public':
    case 'authenticated':
      return Eye
    case 'organization_only':
    case 'private':
      return EyeOff
    default:
      return EyeOff
  }
}

const getVisibilityLabel = (visibility: Project['location_visibility']) => {
  switch (visibility) {
    case 'public':
      return 'Public'
    case 'authenticated':
      return 'Authenticated'
    case 'organization_only':
      return 'Organization Only'
    case 'private':
      return 'Private'
    default:
      return 'Unknown'
  }
}

const createColumns = (_router: ReturnType<typeof useRouter>, theme: 'light' | 'dark') => [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = info.getValue()
      return status.charAt(0).toUpperCase() + status.slice(1)
    },
  }),
  columnHelper.accessor('organization', {
    header: 'Organization',
    cell: (info) => info.getValue()?.name || '-',
  }),
  columnHelper.accessor('location_visibility', {
    header: 'Visibility',
    cell: (info) => {
      const visibility = info.getValue()
      const Icon = getVisibilityIcon(visibility)
      const label = getVisibilityLabel(visibility)
      const hasOverride = info.row.original.location_visibility_override

      return (
        <Row gap={8} align="center">
          <Icon size="md" />
          <Text>{label}</Text>
          {hasOverride && <Text style={{ color: theme === "light" ? colors.yellow[700] : colors.yellow[300] }}>(Override)</Text>}
        </Row>
      )
    },
  }),
  // Actions column removed - using RowActionOverlay instead
]

export function OfficeProjectsList({ showHeader = true }: { showHeader?: boolean }) {
  const { theme } = useThemeContext()
  const router = useRouter()
  const { data: organizationsData } = useAllOrganizations()
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | null | string>(null)

  const { data, isLoading, refetch } = useProjects({
    organizationId: selectedOrg || undefined,
    status: (statusFilter as ProjectStatus) || undefined,
    limit: 50,
    offset: 0,
  })

  const _columns = useMemo(() => createColumns(router, theme), [router, theme])

  const projects = data?.projects || []

  const _handleRowEdit = (project: Project) => {
    router.push(buildPath(ROUTES.OFFICE.CMS.PROJECTS.DETAIL.EDIT, { id: project.id }))
  }

  const _getItemName = (project: Project) => project.name

  return (
    <OfficeLayout
      showBreadcrumb
      leftContent={
        <Stack flex={1} padding="md" gap={16}>
          {showHeader && (
            <Stack gap={8}>
              <H2>Projects</H2>
              <Text style={{ color: colors.text[theme].secondary }}>
                Manage construction projects with geographic data
              </Text>
            </Stack>
          )}
          <Stack gap={16}>
            <Row gap={16} align="center" justify="space-between" flexWrap="wrap">
              <Row gap={16} align="center" flexWrap="wrap">
                {organizationsData && (
                  <Row width={200}>
                    <ResponsiveSelect
                      value={selectedOrg || ''}
                      onValueChange={setSelectedOrg}
                      placeholder="All Organizations"
                      size="sm"
                      options={[
                        { value: '', label: 'All Organizations' },
                        ...(organizationsData?.organizations ?? []).map(
                          (org: { id: string; name: string }) => ({
                            value: org.id,
                            label: org.name,
                          })
                        ),
                      ]}
                    />
                  </Row>
                )}

                <Row width={150}>
                  <ResponsiveSelect
                    value={statusFilter || ''}
                    onValueChange={setStatusFilter}
                    placeholder="All Statuses"
                    size="sm"
                    options={[
                      { value: '', label: 'All Statuses' },
                      { value: 'planning', label: 'Planning' },
                      { value: 'active', label: 'Active' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'on_hold', label: 'On Hold' },
                    ]}
                  />
                </Row>
              </Row>

              <Button
                onPress={() => router.push(ROUTES.OFFICE.CMS.PROJECTS.CREATE.path)}
                style={{
                  backgroundColor: colors.bg[theme].primary,
                  color: colors.text[theme].primary,
                }}
              >
                Create Project
              </Button>
            </Row>

            {isLoading ? (
              <Text>Loading projects...</Text>
            ) : projects.length === 0 ? (
              <Text>No projects found</Text>
            ) : (
              <Stack gap={8}>
                {projects.map((project: (typeof projects)[0]) => (
                  <Row
                    key={project.id}
                    padding="md"
                    style={{ backgroundColor: colors.bg[theme].default }}
                    borderRadius={16}
                    justify="space-between"
                    align="center"
                    borderWidth={1}
                    borderColor={colors.border[theme].default}
                  >
                    <Stack gap={4} flex={1}>
                      <Text>{project.name}</Text>
                      <Text style={{ color: colors.text[theme].tertiary }}>
                        {project.organization?.name || 'No organization'} • {project.status}
                      </Text>
                    </Stack>
                    <Row gap={8} align="center">
                      {getVisibilityIcon(project.location_visibility)({ size: 16 })}
                      <Button
                        size="xs"
                        iconStart={Pencil}
                        onPress={() => {
                          router.push(
                            buildPath(ROUTES.OFFICE.CMS.PROJECTS.DETAIL.EDIT, { id: project.id })
                          )
                        }}
                      >
                        Edit
                      </Button>
                    </Row>
                  </Row>
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>
      }
      rightContent={
        <QuickActionsWidget
          context="list"
          resourceName="Project"
          onCreate={() => router.push(ROUTES.OFFICE.CMS.PROJECTS.CREATE.path)}
          onRefresh={() => refetch()}
          isLoading={isLoading}
        />
      }
    />
  )
}
