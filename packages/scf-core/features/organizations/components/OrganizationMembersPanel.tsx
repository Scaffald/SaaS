import { type OrganizationInvite, organizationInviteSchema } from '@scf/schemas'
import { Table } from '@unicornlove/beyond-ui'
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
  Row,
  Stack,
} from '@unicornlove/beyond-ui'
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
    <Stack gap={16}>
      <Card bordered padding="md" gap={16}>
        <H4>Invite a member</H4>
        <Stack gap={12}>
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Stack gap={4}>
                <Text>Email</Text>
                <Input
                  value={field.value}
                  onChangeText={(value) => field.onChange(value)}
                  placeholder="teammate@example.com"
                />
                {fieldState.error ? <Text color="$red10">{fieldState.error?.message}</Text> : null}
              </Stack>
            )}
          />
          <Controller
            control={form.control}
            name="roleName"
            render={({ field }) => (
              <Stack gap={4}>
                <Text>Role</Text>
                <Input value={field.value} onChangeText={(value) => field.onChange(value)} />
              </Stack>
            )}
          />
          <Controller
            control={form.control}
            name="message"
            render={({ field }) => (
              <Stack gap={4}>
                <Text>Message (optional)</Text>
                <TextArea
                  value={field.value ?? ''}
                  onChangeText={(value) => field.onChange(value ?? '')}
                />
              </Stack>
            )}
          />
          <Button onPress={() => void onSubmit()} disabled={isSubmitting}>
            {isSubmitting ? 'Sending invite…' : 'Send Invitation'}
          </Button>
        </Stack>
      </Card>

      <Card bordered padding="md" gap={12}>
        <Row justify="space-between" align="center">
          <H4>Members</H4>
          {membersLoading ? <Spinner /> : <Text color="$gray11">{activeMembers.length} total</Text>}
        </Row>
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
                        <Text>{member.profile?.display_name ?? 'Unknown'}</Text>
                        <Paragraph color="$gray11">{member.profile?.headline}</Paragraph>
                      </Table.Cell>
                      <Table.Cell>{member.roles.join(', ') || 'Member'}</Table.Cell>
                      <Table.Cell>
                        {activitySummary ? `${activitySummary.actions} actions` : '—'}
                        {activitySummary?.lastActionAt ? (
                          <Paragraph color="$gray11">
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

      <Card bordered padding="md" gap={12}>
        <Row justify="space-between" align="center">
          <H4>Pending invitations</H4>
          {invitesLoading ? <Spinner /> : <Text color="$gray11">{pendingInvites.length} pending</Text>}
        </Row>
        <Separator />
        {invitesLoading ? (
          <Paragraph>Loading invitations…</Paragraph>
        ) : pendingInvites.length === 0 ? (
          <Paragraph color="$gray11">No pending invitations</Paragraph>
        ) : (
          <Stack gap={8}>
            {pendingInvites.map(
              (invite: {
                id: string
                invitee_email: string
                role_name?: string | null
                status: string
              }) => (
                <Row key={invite.id} justify="space-between" align="center">
                  <Stack>
                    <Text>{invite.invitee_email}</Text>
                    <Paragraph color="$gray11">{invite.role_name ?? 'member'}</Paragraph>
                  </Stack>
                  <Text color="$gray11">{invite.status}</Text>
                </Row>
              )
            )}
          </Stack>
        )}
      </Card>
    </Stack>
  )
}
