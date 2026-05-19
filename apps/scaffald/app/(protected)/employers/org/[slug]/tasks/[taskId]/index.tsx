import { useOrgBySlug } from '@scf/core/utils/useOrgBySlug'
import { TaskDetailScreen } from '@scf/core/features/tasks/screens/TaskDetailScreen'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { useLocalSearchParams } from 'expo-router'
import { Stack, Text } from '@scaffald/ui'

export default function OrgTaskDetailPage() {
  const { slug, taskId } = useLocalSearchParams<{ slug: string; taskId: string }>()
  const { org, isLoading, isForbidden } = useOrgBySlug(slug ?? undefined)

  if (isForbidden || (slug && !isLoading && !org)) {
    return (
      <DashboardPage
        showBreadcrumb={false}
        leftContent={
          <Stack padding={16} gap={12}>
            <Text color="error">Organization not found</Text>
            <Text color="tertiary">
              You don&apos;t have access to this organization or it doesn&apos;t exist.
            </Text>
          </Stack>
        }
        rightContent={null}
      />
    )
  }

  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle={org ? `Task · ${org.organizationName}` : 'Task'}
      leftContent={
        taskId ? (
          <TaskDetailScreen taskId={taskId} orgSlug={org?.slug} />
        ) : (
          <Stack padding={16}>
            <Text color="error">Missing task id</Text>
          </Stack>
        )
      }
      rightContent={null}
    />
  )
}
