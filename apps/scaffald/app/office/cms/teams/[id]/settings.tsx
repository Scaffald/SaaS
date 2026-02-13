import { ROUTES } from '@scf/core/constants/routes'
import { TeamSettingsForm } from '@scf/core/features/office/components/TeamSettingsForm'
import { useTeam } from '@scaffald/sdk/react'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import { ArrowLeft } from 'lucide-react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView } from 'react-native'
import { Button, Card, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

const PERMITTED_ROLES = new Set(['super_admin', 'partner_admin', 'office', 'admin', 'manager'])

export default function OfficeTeamSettingsPage() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()
  const teamId = typeof id === 'string' ? id : ''

  const { roles } = useUserRoles()

  const {
    data: teamData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useTeam(teamId, {
    enabled: Boolean(teamId),
    retry: false,
  })

  if (!teamId) {
    return (
      <CenteredMessage
        title="Team not specified"
        description="Provide a team identifier to manage settings."
        actionLabel="Back to teams"
        onAction={() => router.replace(ROUTES.OFFICE.CMS.TEAMS.path)}
      />
    )
  }

  if ((isLoading || isFetching) && !teamData?.team) {
    return (
      <Stack align="center" justify="center" gap={12}>
        <Spinner size="lg" />
        <Text color="gray">Loading team settings…</Text>
      </Stack>
    )
  }

  if (error || !teamData?.team) {
    const message =
      error instanceof Error
        ? error.message
        : 'We were unable to load settings for this team. Please try again.'
    return (
      <CenteredMessage
        title="Unable to load settings"
        description={message}
        actionLabel="Retry"
        onAction={() => void refetch()}
      />
    )
  }

  const team = teamData.team
  const metadata = (team.metadata as Record<string, unknown> | null) ?? {}
  const canEdit = !team.isArchived && roles.some((role: string) => PERMITTED_ROLES.has(role))
  const fallbackRoleId = team.defaultRoleId ?? team.defaultRole?.id ?? null

  return (
    <ScrollView>
      <Stack gap={24} padding={16}>
        <Row>
          <Button
            size="md"
            variant="outline"
            iconStart={ArrowLeft}
            onPress={() => router.push(ROUTES.OFFICE.CMS.TEAMS.path)}
          >
            Back to teams
          </Button>
        </Row>

        {team.isArchived ? (
          <Card padding={12} gap={8}>
            <Text>Archived team</Text>
            <Text color="gray">
              This team has been archived. Update its settings after restoring the team.
            </Text>
          </Card>
        ) : null}

        <TeamSettingsForm
          teamId={team.id}
          organizationId={team.organizationId}
          metadata={metadata}
          fallbackRoleId={fallbackRoleId}
          canEdit={canEdit}
        />
      </Stack>
    </ScrollView>
  )
}

function CenteredMessage({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <Stack align="center" justify="center" gap={12}>
      <Card padding={16} gap={12}>
        <Text>{title}</Text>
        <Text color="gray">{description}</Text>
        <Button onPress={onAction}>{actionLabel}</Button>
      </Card>
    </Stack>
  )
}
