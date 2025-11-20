import { ROUTES, RouteBuilder } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { useAllOrganizations } from '@app/core/utils/useAllOrganizations'
import { DashboardLayout, Sheet } from '@app/ui'
import {
  Check,
  Eye,
  EyeOff,
  Pencil,
} from '@tamagui/lucide-icons'
import { createColumnHelper } from '@tanstack/react-table'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Adapt, Button, H2, Select, Text, XStack, YStack } from 'tamagui'
import { QuickActionsWidget } from '../components/QuickActionsWidget'

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

const createColumns = (_router: ReturnType<typeof useRouter>) => [
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
        <XStack gap="$2" items="center">
          <Icon size={16} />
          <Text>{label}</Text>
          {hasOverride && (
            <Text fontSize="$1" color="$yellow10">
              (Override)
            </Text>
          )}
        </XStack>
      )
    },
  }),
  // Actions column removed - using RowActionOverlay instead
]

export function OfficeProjectsList({ showHeader = true }: { showHeader?: boolean }) {
  const router = useRouter()
  const { data: organizationsData } = useAllOrganizations()
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | null>(null)

  const { data, isLoading, refetch } = api.projects.list.useQuery({
    organization_id: selectedOrg || undefined,
    status: statusFilter || undefined,
    limit: 50,
    offset: 0,
  })

  const _columns = useMemo(() => createColumns(router), [router])

  const projects = data?.projects || []

  const _handleRowEdit = (project: Project) => {
    router.push(RouteBuilder.projectEdit(project.id))
  }

  const _getItemName = (project: Project) => project.name

  return (
    <DashboardLayout
      leftContent={
        <YStack flex={1} p="$4" gap="$4">
          {showHeader && (
            <YStack gap="$2">
              <H2>Projects</H2>
              <Text fontSize="$4" color="$gray11">
                Manage construction projects with geographic data
              </Text>
            </YStack>
          )}
          <YStack gap="$4">
            <XStack gap="$4" items="center" justify="space-between" flexWrap="wrap">
              <XStack gap="$4" items="center" flexWrap="wrap">
                {organizationsData && (
                  <XStack width={200}>
                    <Select value={selectedOrg || ''} onValueChange={setSelectedOrg} size="$3">
                      <Select.Trigger>
                        <Select.Value placeholder="All Organizations" />
                      </Select.Trigger>
                      <Adapt when="sm" platform="touch">
                        <Sheet modal dismissOnSnapToBottom>
                          <Sheet.Frame>
                            <Sheet.ScrollView>
                              <Adapt.Contents />
                            </Sheet.ScrollView>
                          </Sheet.Frame>
                          <Sheet.Overlay />
                        </Sheet>
                      </Adapt>
                      <Select.Content zIndex={200000}>
                        <Select.Viewport>
                          <Select.Item index={0} value="" key="all">
                            <Select.ItemText>All Organizations</Select.ItemText>
                            <Select.ItemIndicator marginLeft="auto">
                              <Check size={16} />
                            </Select.ItemIndicator>
                          </Select.Item>
                          {organizationsData.map((org: (typeof organizationsData)[0]) => (
                            <Select.Item
                              key={org.id}
                              value={org.id}
                              index={organizationsData.indexOf(org) + 1}
                            >
                              <Select.ItemText>{org.name}</Select.ItemText>
                              <Select.ItemIndicator marginLeft="auto">
                                <Check size={16} />
                              </Select.ItemIndicator>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select>
                  </XStack>
                )}

                <XStack width={150}>
                  <Select value={statusFilter || ''} onValueChange={setStatusFilter} size="$3">
                    <Select.Trigger>
                      <Select.Value placeholder="All Statuses" />
                    </Select.Trigger>
                    <Adapt when="sm" platform="touch">
                      <Sheet modal dismissOnSnapToBottom>
                        <Sheet.Frame>
                          <Sheet.ScrollView>
                            <Adapt.Contents />
                          </Sheet.ScrollView>
                        </Sheet.Frame>
                        <Sheet.Overlay />
                      </Sheet>
                    </Adapt>
                    <Select.Content zIndex={200000}>
                      <Select.Viewport>
                        <Select.Item index={0} value="" key="all">
                          <Select.ItemText>All Statuses</Select.ItemText>
                          <Select.ItemIndicator marginLeft="auto">
                            <Check size={16} />
                          </Select.ItemIndicator>
                        </Select.Item>
                        <Select.Item index={1} value="planning" key="planning">
                          <Select.ItemText>Planning</Select.ItemText>
                          <Select.ItemIndicator marginLeft="auto">
                            <Check size={16} />
                          </Select.ItemIndicator>
                        </Select.Item>
                        <Select.Item index={2} value="active" key="active">
                          <Select.ItemText>Active</Select.ItemText>
                          <Select.ItemIndicator marginLeft="auto">
                            <Check size={16} />
                          </Select.ItemIndicator>
                        </Select.Item>
                        <Select.Item index={3} value="completed" key="completed">
                          <Select.ItemText>Completed</Select.ItemText>
                          <Select.ItemIndicator marginLeft="auto">
                            <Check size={16} />
                          </Select.ItemIndicator>
                        </Select.Item>
                        <Select.Item index={4} value="on_hold" key="on_hold">
                          <Select.ItemText>On Hold</Select.ItemText>
                          <Select.ItemIndicator marginLeft="auto">
                            <Check size={16} />
                          </Select.ItemIndicator>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select>
                </XStack>
              </XStack>

              <Button
                onPress={() => router.push(ROUTES.OFFICE.CMS.PROJECTS.CREATE.path)}
                bg="$blue9"
                color="$blue12"
              >
                Create Project
              </Button>
            </XStack>

            {isLoading ? (
              <Text>Loading projects...</Text>
            ) : projects.length === 0 ? (
              <Text>No projects found</Text>
            ) : (
              <YStack gap="$2">
                {projects.map((project: (typeof projects)[0]) => (
                  <XStack
                    key={project.id}
                    p="$4"
                    bg="$background"
                    rounded="$4"
                    justify="space-between"
                    items="center"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <YStack gap="$1" flex={1}>
                      <Text fontWeight="600">{project.name}</Text>
                      <Text fontSize="$2" color="$gray10">
                        {project.organization?.name || 'No organization'} • {project.status}
                      </Text>
                    </YStack>
                    <XStack gap="$2" items="center">
                      {getVisibilityIcon(project.location_visibility)({ size: 16 })}
                      <Button
                        size="$2"
                        icon={Pencil}
                        onPress={() => {
                          router.push(RouteBuilder.projectEdit(project.id))
                        }}
                      >
                        Edit
                      </Button>
                    </XStack>
                  </XStack>
                ))}
              </YStack>
            )}
          </YStack>
        </YStack>
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
