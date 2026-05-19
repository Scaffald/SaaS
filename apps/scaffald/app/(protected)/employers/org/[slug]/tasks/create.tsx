import { useOrgBySlug } from '@scf/core/utils/useOrgBySlug'
import { TaskCreateScreen } from '@scf/core/features/tasks/screens/TaskCreateScreen'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { useLocalSearchParams } from 'expo-router'
import { Stack, Text } from '@scaffald/ui'

export default function OrgTaskCreatePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
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
      pageTitle={org ? `New Task · ${org.organizationName}` : 'New Task'}
      leftContent={
        <TaskCreateScreen organizationId={org?.organizationId} orgSlug={org?.slug} />
      }
      rightContent={null}
    />
  )
}
