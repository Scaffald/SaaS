import { type OrganizationInvite, organizationInviteSchema } from '@app/schemas'
import { Table } from '@app/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Button,
  Card,
  H4,
  Input,
  Paragraph,
  Separator,
  Spinner,
  Text,
  TextArea,
  XStack,
  YStack,
} from 'tamagui'
import {
  useInviteOrganizationMember,
  useOrganizationInvites,
  useOrganizationMemberActivity,
  useOrganizationMembers,
} from '../api'

type OrganizationMembersPanelProps = {
  organizationId: string
}

export function OrganizationMembersPanel({ organizationId }: OrganizationMembersPanelProps) {
  const { data: members, isLoading: membersLoading } = useOrganizationMembers(organizationId)
  const {
    data: invites,
    isLoading: invitesLoading,
    refetch: refetchInvites,
  } = useOrganizationInvites(organizationId, ['pending', 'sent', 'viewed'])
  const { data: activity } = useOrganizationMemberActivity(organizationId)
  const inviteMutation = useInviteOrganizationMember()

  const form = useForm<OrganizationInvite>({
    resolver: zodResolver(organizationInviteSchema),
    defaultValues: { email: '', roleName: 'member', message: '' },
  })

  const isSubmitting = inviteMutation.isPending

  const onSubmit = form.handleSubmit(async (values) => {
    await inviteMutation.mutateAsync(
      {
        organizationId,
        email: values.email,
        roleName: values.roleName ?? 'member',
        message: values.message,
      },
      {
        onSuccess: () => {
          form.reset({ email: '', roleName: 'member', message: '' })
          void refetchInvites()
        },
      }
    )
  })

  const activeMembers = members ?? []
  const pendingInvites = invites ?? []
  const activityByUser = useMemo(() => {
    if (!activity) return new Map<string, { actions: number; lastActionAt: string | null }>()
    return new Map(
      activity.map((entry: { userId: string; actions: number; lastActionAt: string | null }) => [
        entry.userId,
        entry,
      ])
    )
  }, [activity])

  return (
    <YStack gap="$4">
      <Card bordered padding="$4" gap="$4">
        <H4>Invite a member</H4>
        <YStack gap="$3">
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <YStack gap="$1">
                <Text fontWeight="600">Email</Text>
                <Input
                  value={field.value}
                  onChangeText={(value) => field.onChange(value)}
                  placeholder="teammate@example.com"
                />
                {fieldState.error ? (
                  <Text color="$red10" fontSize="$2">
                    {fieldState.error?.message}
                  </Text>
                ) : null}
              </YStack>
            )}
          />
          <Controller
            control={form.control}
            name="roleName"
            render={({ field }) => (
              <YStack gap="$1">
                <Text fontWeight="600">Role</Text>
                <Input value={field.value} onChangeText={(value) => field.onChange(value)} />
              </YStack>
            )}
          />
          <Controller
            control={form.control}
            name="message"
            render={({ field }) => (
              <YStack gap="$1">
                <Text fontWeight="600">Message (optional)</Text>
                <TextArea
                  value={field.value ?? ''}
                  onChangeText={(value) => field.onChange(value ?? '')}
                />
              </YStack>
            )}
          />
          <Button onPress={() => void onSubmit()} disabled={isSubmitting}>
            {isSubmitting ? 'Sending invite…' : 'Send Invitation'}
          </Button>
        </YStack>
      </Card>

      <Card bordered padding="$4" gap="$3">
        <XStack justify="space-between" items="center">
          <H4>Members</H4>
          {membersLoading ? (
            <Spinner />
          ) : (
            <Text color="$color10">{activeMembers.length} total</Text>
          )}
        </XStack>
        <Separator />
        {membersLoading ? (
          <Paragraph>Loading members…</Paragraph>
        ) : (
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Roles</Table.HeaderCell>
                <Table.HeaderCell>Recent Activity</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {activeMembers.map(
                (member: {
                  userId: string
                  roles: string[]
                  profile?: { display_name?: string; headline?: string } | null
                }) => {
                  const activitySummary:
                    | { actions: number; lastActionAt: string | null }
                    | undefined = member.userId
                    ? (activityByUser.get(member.userId) as
                        | { actions: number; lastActionAt: string | null }
                        | undefined)
                    : undefined
                  return (
                    <Table.Row key={member.userId}>
                      <Table.Cell>
                        <Text fontWeight="600">{member.profile?.display_name ?? 'Unknown'}</Text>
                        <Paragraph color="$color10">{member.profile?.headline}</Paragraph>
                      </Table.Cell>
                      <Table.Cell>{member.roles.join(', ') || 'Member'}</Table.Cell>
                      <Table.Cell>
                        {activitySummary ? `${activitySummary.actions} actions` : '—'}
                        {activitySummary?.lastActionAt ? (
                          <Paragraph color="$color10">
                            {new Date(activitySummary.lastActionAt).toLocaleDateString()}
                          </Paragraph>
                        ) : null}
                      </Table.Cell>
                    </Table.Row>
                  )
                }
              )}
            </Table.Body>
          </Table>
        )}
      </Card>

      <Card bordered padding="$4" gap="$3">
        <XStack justify="space-between" items="center">
          <H4>Pending invitations</H4>
          {invitesLoading ? (
            <Spinner />
          ) : (
            <Text color="$color10">{pendingInvites.length} pending</Text>
          )}
        </XStack>
        <Separator />
        {invitesLoading ? (
          <Paragraph>Loading invitations…</Paragraph>
        ) : pendingInvites.length === 0 ? (
          <Paragraph color="$color10">No pending invitations</Paragraph>
        ) : (
          <YStack gap="$2">
            {pendingInvites.map(
              (invite: {
                id: string
                invitee_email: string
                role_name?: string | null
                status: string
              }) => (
                <XStack key={invite.id} justify="space-between" items="center">
                  <YStack>
                    <Text fontWeight="600">{invite.invitee_email}</Text>
                    <Paragraph color="$color10">{invite.role_name ?? 'member'}</Paragraph>
                  </YStack>
                  <Text color="$color10">{invite.status}</Text>
                </XStack>
              )
            )}
          </YStack>
        )}
      </Card>
    </YStack>
  )
}
