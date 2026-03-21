import { RouteBuilder } from '@scf/core/constants/routes'
import { useOrgBySlug } from '@scf/core/utils/useOrgBySlug'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { useTeams } from '@scf/core/utils/teams-sdk-hooks'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Button, Card, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { Users } from 'lucide-react-native'
import type { Team } from '@scaffald/sdk'

export default function OrgTeamsIndexPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const { org, isLoading: orgLoading } = useOrgBySlug(slug ?? undefined)
  const { data, isLoading: teamsLoading, error, refetch, isRefetching } = useTeams(
    { organizationId: org?.organizationId, includeArchived: false },
    { enabled: !!org?.organizationId }
  )

  const teams = useMemo<Team[]>(() => data?.teams ?? [], [data?.teams])
  const isLoading = orgLoading || teamsLoading
  const showForbidden = !!slug && !orgLoading && !org && !teamsLoading

  if (showForbidden) {
    return (
      <DashboardPage
        showBreadcrumb={false}
        leftContent={
          <Stack padding={16} gap={12}>
            <Text color="red">Organization not found</Text>
            <Button size="md" variant="outline" onPress={() => router.back()}>
              Back
            </Button>
          </Stack>
        }
        rightContent={null}
      />
    )
  }

  const mainContent = (
    <Stack gap={16}>
      <Row justify="space-between" align="center">
        <Stack gap={4}>
          <Text>Teams</Text>
          <Text color="gray">
            {org?.organizationName
              ? `Teams in ${org.organizationName}. Open a team to collaborate.`
              : 'View teams in this organization.'}
          </Text>
        </Stack>
        {slug && (
          <Button variant="outline" size="md" onPress={() => router.push(RouteBuilder.orgInvitations())}>
            Manage invitations
          </Button>
        )}
      </Row>

      {isLoading || isRefetching ? (
        <Stack align="center" justify="center" gap={8}>
          <Spinner size="lg" />
          <Text color="gray">Loading teams…</Text>
        </Stack>
      ) : error ? (
        <Stack gap={12} padding={16}>
          <Text color="red">Unable to load teams</Text>
          <Text color="red">{error.message ?? 'An unexpected error occurred.'}</Text>
          <Button size="md" onPress={() => refetch()}>
            Try again
          </Button>
        </Stack>
      ) : teams.length === 0 ? (
        <Stack gap={12} padding={16}>
          <Text>No teams yet</Text>
          <Text color="gray">
            This organization has no teams yet, or you don't have access. Accept an invitation to join a team.
          </Text>
          <Button size="md" variant="outline" onPress={() => router.push(RouteBuilder.orgInvitations())}>
            View invitations
          </Button>
        </Stack>
      ) : (
        <Stack gap={12}>
          {teams.map((team) => {
            const formattedPurpose = team.purpose
              ? team.purpose.replace(/^\w/, (char: string) => char.toUpperCase())
              : 'General'
            return (
              <Card key={team.id} padding="md">
                <Stack gap={12}>
                  <Row gap={12} align="center">
                    <Users size={20} />
                    <Text>{team.name || 'Untitled team'}</Text>
                  </Row>
                  {team.description ? (
                    <Text color="gray">{team.description}</Text>
                  ) : (
                    <Text color="gray">No description provided.</Text>
                  )}
                  <Row gap={12} align="center">
                    <Text color="gray">{formattedPurpose}</Text>
                    <Text color="gray">
                      Visibility: {team.visibility === 'private' ? 'Private' : 'Organization'}
                    </Text>
                  </Row>
                  {slug && (
                    <Button
                      size="md"
                      onPress={() => router.push(RouteBuilder.orgTeamDetail(slug, team.id))}
                    >
                      Open team
                    </Button>
                  )}
                </Stack>
              </Card>
            )
          })}
        </Stack>
      )}
    </Stack>
  )

  return (
    <DashboardPage
      showBreadcrumb={false}
      pageTitle={org?.organizationName ? `Teams · ${org.organizationName}` : 'Teams'}
      leftContent={mainContent}
      rightContent={null}
    />
  )
}
