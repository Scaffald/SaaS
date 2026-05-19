import { useOrgBySlug } from '@scf/core/utils/useOrgBySlug'
import { TasksListScreen } from '@scf/core/features/tasks/screens/TasksListScreen'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { useLocalSearchParams } from 'expo-router'
import { Stack, Text } from '@scaffald/ui'

export default function OrgTasksIndexPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { org, isLoading, isForbidden } = useOrgBySlug(slug ?? undefined)

  if (isForbidden || (slug && !isLoading && !org)) {
    return (
      <DashboardPage
        showBreadcrumb={false}
        leftContent={
          <Stack padding={16} gap={12}>
            <Text color="error">Organization not found</Text>
            <Text color="tertiary">You don&apos;t have access to this organization or it doesn&apos;t exist.</Text>
          </Stack>
        }
        rightContent={null}
      />
    )
  }

  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle={org ? `Tasks · ${org.organizationName}` : 'Tasks'}
      leftContent={
        <TasksListScreen
          organizationId={org?.organizationId}
          orgSlug={org?.slug}
        />
      }
      rightContent={null}
    />
  )
}
