import {
  TeamForm,
  TeamInvitationsList,
  TeamInviteModal,
  TeamMembersList,
} from '@app/core/features/office/teams'
import { api } from '@app/core/utils/api'
import {
  type TEAM_INVITATION_POLICIES,
  TEAM_VISIBILITIES,
  teamInvitationPolicySchema,
  teamRoleKeySchema,
} from '@app/schemas'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Button, Spinner, Text, XStack, YStack } from 'tamagui'

export default function EditTeamPage() {
  const router = useRouter()
  const params = useLocalSearchParams<{ id?: string }>()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteRefreshKey, setInviteRefreshKey] = useState(0)
  const teamId = useMemo(() => {
    const value = params.id
    if (!value) {
      return null
    }
    return Array.isArray(value) ? value[0] : value
  }, [params.id])

  const { data, isLoading, isFetching, error, refetch } = api.teams.byId.useQuery(
    { teamId: teamId ?? '' },
    {
      enabled: Boolean(teamId),
    }
  )

  if (!teamId) {
    return (
      <YStack flex={1} items="center" justify="center" gap="$4" p="$6">
        <Text fontSize="$6" fontWeight="700">
          Missing team identifier
        </Text>
        <Text color="$color11" style={{ textAlign: 'center' }}>
          We couldn&apos;t determine which team you want to edit.
        </Text>
        <Button onPress={() => router.back()} variant="outlined">
          Go Back
        </Button>
      </YStack>
    )
  }

  if (isLoading || isFetching) {
    return (
      <YStack flex={1} items="center" justify="center">
        <Spinner size="large" />
        <Text mt="$4">Loading team details…</Text>
      </YStack>
    )
  }

  if (error || !data?.team) {
    return (
      <YStack flex={1} items="center" justify="center" gap="$3" p="$6">
        <Text fontSize="$6" fontWeight="700">
          Unable to load team
        </Text>
        <Text color="$color11" style={{ textAlign: 'center' }}>
          {error?.message ?? 'We ran into a problem retrieving this team. Please try again.'}
        </Text>
        <XStack gap="$2">
          <Button onPress={() => router.back()} variant="outlined">
            Go Back
          </Button>
          <Button onPress={() => refetch()}>Try Again</Button>
        </XStack>
      </YStack>
    )
  }

  const { team } = data

  const visibility: (typeof TEAM_VISIBILITIES)[number] = TEAM_VISIBILITIES.includes(
    (team.visibility ?? '') as (typeof TEAM_VISIBILITIES)[number]
  )
    ? (team.visibility as (typeof TEAM_VISIBILITIES)[number])
    : 'organization'

  const invitationPolicy = teamInvitationPolicySchema.safeParse(
    team.invitationPolicy ?? 'invite_only'
  ).success
    ? (team.invitationPolicy as (typeof TEAM_INVITATION_POLICIES)[number])
    : 'invite_only'

  const defaultRoleKey = team.defaultRole?.key
  const parsedDefaultRoleKey = defaultRoleKey
    ? teamRoleKeySchema.safeParse(defaultRoleKey).success
      ? (defaultRoleKey as ReturnType<(typeof teamRoleKeySchema)['parse']>)
      : undefined
    : undefined

  return (
    <YStack flex={1} gap="$6" p="$4">
      <TeamForm
        mode="edit"
        organizationId={team.organizationId}
        teamId={team.id}
        onCancel={() => router.back()}
        initialData={{
          id: team.id,
          name: team.name ?? '',
          slug: team.slug ?? undefined,
          purpose: team.purpose ?? undefined,
          visibility,
          invitationPolicy,
          description: team.description ?? undefined,
          defaultRole: team.defaultRole
            ? {
                id: team.defaultRole.id,
                key: teamRoleKeySchema.parse(team.defaultRole.key),
              }
            : null,
          defaultRoleId: team.defaultRole?.id ?? team.defaultRoleId ?? null,
          defaultRoleKey: parsedDefaultRoleKey ?? undefined,
        }}
      />

      <TeamMembersList teamId={team.id} organizationId={team.organizationId} />

      <TeamInvitationsList
        teamId={team.id}
        refreshKey={inviteRefreshKey}
        headerAction={
          <Button bg="$color9" color="$color1" size="$3" onPress={() => setIsInviteModalOpen(true)}>
            Invite member
          </Button>
        }
      />

      <TeamInviteModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        teamId={team.id}
        organizationId={team.organizationId}
        defaultRoleId={team.defaultRoleId ?? team.defaultRole?.id ?? null}
        onInvited={() => setInviteRefreshKey((value) => value + 1)}
      />
    </YStack>
  )
}
