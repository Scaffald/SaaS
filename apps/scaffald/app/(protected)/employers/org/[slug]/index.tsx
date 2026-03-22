import { RouteBuilder } from '@scf/core/constants/routes'
import { useOrgBySlug } from '@scf/core/utils/useOrgBySlug'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { Building2, ClipboardList, FileText } from 'lucide-react-native'

export default function OrgDetailPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const { org, isLoading, isForbidden } = useOrgBySlug(slug ?? undefined)

  if (isLoading || !slug) {
    return (
      <DashboardPage
        showBreadcrumb={false}
        leftContent={
          <Stack padding={16} align="center" justify="center" gap={8}>
            <Spinner size="lg" />
            <Text color="gray">Loading organization…</Text>
          </Stack>
        }
        rightContent={null}
      />
    )
  }

  if (isForbidden || !org) {
    return (
      <DashboardPage
        showBreadcrumb={false}
        leftContent={
          <Stack padding={16} gap={12}>
            <Text color="red">Organization not found</Text>
            <Text color="gray">You don't have access to this organization or it doesn't exist.</Text>
            <Button size="md" variant="outline" onPress={() => router.push(RouteBuilder.orgIndex())}>
              Back to My Organizations
            </Button>
          </Stack>
        }
        rightContent={null}
      />
    )
  }

  const content = (
    <Stack padding={16} gap={24}>
      <Row gap={12} align="center">
        <Building2 size={32} />
        <Stack gap={4}>
          <Text>{org.organizationName}</Text>
          <Text color="gray">{org.slug}</Text>
        </Stack>
      </Row>

      <Stack gap={12}>
        <Text color="gray">Quick links</Text>
        <Row gap={12} style={{ flexWrap: 'wrap' }}>
          <Button
            size="md"
            variant="outline"
            iconStart={ClipboardList}
            onPress={() => router.push(RouteBuilder.orgTeams(org.slug))}
          >
            Teams
          </Button>
          <Button
            size="md"
            variant="outline"
            iconStart={FileText}
            onPress={() => router.push(RouteBuilder.orgLogs(org.slug))}
          >
            Logs
          </Button>
        </Row>
      </Stack>
    </Stack>
  )

  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle={org.organizationName}
      leftContent={content}
      rightContent={null}
    />
  )
}
