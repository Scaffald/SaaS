import { RouteBuilder } from '@scf/core/constants/routes'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { Building2 } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Button, Card, Spinner, Text, Row, Stack } from '@scaffald/ui'
import type { OrganizationMembership } from '@scf/core/utils/useOrganizations'

function dedupeByOrgId(memberships: OrganizationMembership[]): OrganizationMembership[] {
  const seen = new Set<string>()
  return memberships.filter((m) => {
    if (seen.has(m.organization_id)) return false
    seen.add(m.organization_id)
    return true
  })
}

export default function OrgIndexPage() {
  const router = useRouter()
  const { data: memberships, isLoading, error, refetch } = useOrganizations()
  const orgs = useMemo(() => dedupeByOrgId(memberships ?? []), [memberships])

  const content = (
    <Stack gap={16}>
      <Stack gap={4}>
        <Text>My Organizations</Text>
        <Text color="gray">
          Organizations you belong to via teams. Open an organization to view its teams and logs.
        </Text>
      </Stack>

      {isLoading ? (
        <Stack align="center" justify="center" gap={8}>
          <Spinner size="lg" />
          <Text color="gray">Loading your organizations…</Text>
        </Stack>
      ) : error ? (
        <Stack gap={12} padding={16}>
          <Text color="red">Unable to load organizations</Text>
          <Text color="red">{error.message ?? 'An unexpected error occurred.'}</Text>
          <Button size="md" onPress={() => refetch()}>
            Try again
          </Button>
        </Stack>
      ) : orgs.length === 0 ? (
        <Stack gap={12} padding={16}>
          <Text>No organizations yet</Text>
          <Text color="gray">
            You are not a member of any organizations yet. Accept a team invitation to see organizations here.
          </Text>
          <Button
            size="md"
            variant="outline"
            onPress={() => router.push(RouteBuilder.orgInvitations())}
          >
            View invitations
          </Button>
        </Stack>
      ) : (
        <Stack gap={12}>
          {orgs.map((m) => (
            <Card key={m.organization_id} padding="md">
              <Row gap={12} align="center">
                <Building2 size={24} />
                <Stack gap={4} style={{ flex: 1 }}>
                  <Text>{m.organization_name || 'Unnamed organization'}</Text>
                  <Text color="gray">{m.organization_slug}</Text>
                </Stack>
                <Button
                  size="md"
                  onPress={() => router.push(RouteBuilder.orgDetail(m.organization_slug))}
                >
                  Open
                </Button>
              </Row>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  )

  return <DashboardPage showBreadcrumb={false} pageTitle="My Organizations" leftContent={content} rightContent={null} />
}
