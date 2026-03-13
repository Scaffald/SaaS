import { useOrgBySlug } from '@scf/core/utils/useOrgBySlug'
import { WorkLogListScreen } from '@scf/core/features/work-logs/screens/WorkLogListScreen'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { useLocalSearchParams } from 'expo-router'
import { Stack, Text } from '@scaffald/ui'

export default function OrgLogsIndexPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { org, isLoading, isForbidden } = useOrgBySlug(slug ?? undefined)

  if (isForbidden || (slug && !isLoading && !org)) {
    return (
      <DashboardPage
        showBreadcrumb={false}
        leftContent={
          <Stack padding={16} gap={12}>
            <Text color="red">Organization not found</Text>
            <Text color="gray">You don’t have access to this organization or it doesn’t exist.</Text>
          </Stack>
        }
        rightContent={null}
      />
    )
  }

  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle={org ? `Logs · ${org.organizationName}` : 'Logs'}
      leftContent={
        <WorkLogListScreen
          organizationId={org?.organizationId}
          orgSlug={org?.slug}
        />
      }
      rightContent={null}
    />
  )
}
