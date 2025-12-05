import { ROUTES } from '@scf/core/constants/routes'
import { TeamSettingsForm } from '@scf/core/features/office/components/TeamSettingsForm'
import { api } from '@scf/core/utils/api'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import type { AppRouter } from '@scf/supabase/client-types'
import { ArrowLeft } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button, Card, ScrollView, Spinner, Text, XStack, YStack } from '@unicornlove/ui'

type TeamDetailOutput = inferRouterOutputs<AppRouter>['teams']['byId']
type TeamRecord = TeamDetailOutput['team']

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
  } = api.teams.byId.useQuery(
    { teamId },
    {
      enabled: Boolean(teamId),
      retry: false,
    }
  )

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
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <Spinner size="large" />
        <Text color="$color11">Loading team settings…</Text>
      </YStack>
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

  const team = teamData.team as TeamRecord
  const metadata = (team.metadata as Record<string, unknown> | null) ?? {}
  const canEdit = !team.isArchived && roles.some((role: string) => PERMITTED_ROLES.has(role))
  const fallbackRoleId = team.defaultRoleId ?? team.defaultRole?.id ?? null

  return (
    <ScrollView>
      <YStack flex={1} gap="$6" padding="$4">
        <XStack>
          <Button
            size="$2"
            variant="outlined"
            icon={ArrowLeft}
            onPress={() => router.push(ROUTES.OFFICE.CMS.TEAMS.path)}
          >
            Back to teams
          </Button>
        </XStack>

        {team.isArchived ? (
          <Card
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="$color2"
            padding="$3"
            gap="$2"
          >
            <Text fontWeight="600">Archived team</Text>
            <Text color="$color11">
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
      </YStack>
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
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$3" paddingHorizontal="$4">
      <Card
        padding="$4"
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="$color2"
        gap="$3"
      >
        <Text fontSize="$6" fontWeight="700">
          {title}
        </Text>
        <Text color="$color11">{description}</Text>
        <Button onPress={onAction}>{actionLabel}</Button>
      </Card>
    </YStack>
  )
}
