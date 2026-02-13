import {
  TeamForm,
  TeamInvitationsList,
  TeamInviteModal,
  TeamMembersList,
} from '@scf/core/features/office/teams'
import { useTeam } from '@scaffald/sdk/react'
import {
  type TEAM_INVITATION_POLICIES,
  TEAM_VISIBILITIES,
  teamInvitationPolicySchema,
  teamRoleKeySchema,
} from '@scf/schemas'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Button, Spinner, Text, Row, Stack } from '@scaffald/ui'

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

  const { data, isLoading, isFetching, error, refetch } = useTeam(teamId ?? '', {
    enabled: Boolean(teamId),
  })

  if (!teamId) {
    return (
      <Stack align="center" justify="center" gap={16} padding={24}>
        <Text>Missing team identifier</Text>
        <Text color="gray" style={{ textAlign: 'center' }}>
          We couldn&apos;t determine which team you want to edit.
        </Text>
        <Button onPress={() => router.back()} variant="outline">
          Go Back
        </Button>
      </Stack>
    )
  }

  if (isLoading || isFetching) {
    return (
      <Stack align="center" justify="center">
        <Spinner size="lg" />
        <Text>Loading team details…</Text>
      </Stack>
    )
  }

  if (error || !data?.team) {
    return (
      <Stack align="center" justify="center" gap={12} padding={24}>
        <Text>Unable to load team</Text>
        <Text color="gray" style={{ textAlign: 'center' }}>
          {error?.message ?? 'We ran into a problem retrieving this team. Please try again.'}
        </Text>
        <Row gap={8}>
          <Button onPress={() => router.back()} variant="outline">
            Go Back
          </Button>
          <Button onPress={() => refetch()}>Try Again</Button>
        </Row>
      </Stack>
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
    <Stack gap={24} padding={16}>
      <TeamForm
        mode="edit"
        organizationId={team.organizationId}
        teamId={team.id}
        onCancel={() => router.back()}
        initialData={{
          defaultRole: team.defaultRole
            ? {
                id: team.defaultRole.id,
                key: teamRoleKeySchema.parse(team.defaultRole.key),
              }
            : null,
          defaultRoleId: team.defaultRole?.id ?? team.defaultRoleId ?? null,
          defaultRoleKey: parsedDefaultRoleKey ?? undefined,
          description: team.description ?? undefined,
          id: team.id,
          invitationPolicy,
          name: team.name ?? '',
          purpose: team.purpose ?? undefined,
          slug: team.slug ?? undefined,
          visibility,
        }}
      />

      <TeamMembersList teamId={team.id} organizationId={team.organizationId} />

      <TeamInvitationsList
        teamId={team.id}
        refreshKey={inviteRefreshKey}
        headerAction={
          <Button color="primary" size="md" onPress={() => setIsInviteModalOpen(true)}>
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
    </Stack>
  )
}
