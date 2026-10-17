import { ROUTES } from '@scf/core/constants/routes'
import { useOrgBySlug } from '@scf/core/utils/useOrgBySlug'
import { LoadFailure } from '@scf/core/components/ui'
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
          <LoadFailure
            error={{ statusCode: 404 }}
            noun="organization"
            back={{ label: 'My organizations', href: ROUTES.EMPLOYERS.ORGANIZATIONS.path }}
          />
        }
        rightContent={null}
      />
    )
  }

  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle={org ? `Logs · ${org.organizationName}` : 'Logs'}
      leftContent={<WorkLogListScreen organizationId={org?.organizationId} orgSlug={org?.slug} />}
      rightContent={null}
    />
  )
}
