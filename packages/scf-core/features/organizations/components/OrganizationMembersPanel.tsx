import { type OrganizationInvite, organizationInviteSchema } from '@scf/schemas'
import { Table, type TableColumn, type TableRowData, useThemeContext } from '@scaffald/ui'
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
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
  const { theme } = useThemeContext()
  const { data: membersResponse, isLoading: membersLoading } = useOrganizationMembers(organizationId)
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
        params: {
          email: values.email,
          roleName: values.roleName ?? 'member',
          message: values.message,
        },
      },
      {
        onSuccess: () => {
          form.reset({ email: '', roleName: 'member', message: '' })
          void refetchInvites()
        },
      }
    )
  })

  const activeMembers = membersResponse?.data ?? []
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

  const membersColumns: TableColumn[] = [
    {
      id: 'name',
      title: 'Name',
      render: (_value, row) => (
        <>
          <Text>{String(row.display_name ?? 'Unknown')}</Text>
          {row.headline ? (
            <Paragraph style={{ color: colors.text[theme].secondary }}>
              {String(row.headline)}
            </Paragraph>
          ) : null}
        </>
      ),
    },
    {
      id: 'roles',
      title: 'Roles',
      render: (_value, row) => {
        const roles = row.roles as string[]
        return <>{roles.join(', ') || 'Member'}</>
      },
    },
    {
      id: 'activity',
      title: 'Recent Activity',
      render: (_value, row) => {
        const activitySummary = row.userId
          ? activityByUser.get(String(row.userId))
          : undefined
        return (
          <>
            {activitySummary ? `${activitySummary.actions} actions` : '—'}
            {activitySummary?.lastActionAt ? (
              <Paragraph style={{ color: colors.text[theme].secondary }}>
                {new Date(activitySummary.lastActionAt).toLocaleDateString()}
              </Paragraph>
            ) : null}
          </>
        )
      },
    },
  ]

  const membersTableData: TableRowData[] = activeMembers.map((member) => ({
    id: member.userId,
    userId: member.userId,
    display_name: member.profile?.display_name ?? null,
    headline: member.profile?.headline ?? null,
    roles: member.roles,
  }))

  return (
    <Stack gap={16}>
      <Card variant="outlined" padding="md">
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
                {fieldState.error ? (
                  <Text style={{ color: theme === 'light' ? colors.error[700] : colors.error[300] }}>
                    {fieldState.error?.message}
                  </Text>
                ) : null}
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

      <Card variant="outlined" padding="md">
        <Row justify="space-between" align="center">
          <H4>Members</H4>
          {membersLoading ? (
            <Spinner />
          ) : (
            <Text style={{ color: colors.text[theme].secondary }}>
              {activeMembers.length} total
            </Text>
          )}
        </Row>
        <Separator />
        {membersLoading ? (
          <Paragraph>Loading members…</Paragraph>
        ) : (
          <Table
            columns={membersColumns}
            data={membersTableData}
            loading={membersLoading}
            emptyMessage="No members found."
            showHeader={false}
          />
        )}
      </Card>

      <Card variant="outlined" padding="md">
        <Row justify="space-between" align="center">
          <H4>Pending invitations</H4>
          {invitesLoading ? (
            <Spinner />
          ) : (
            <Text style={{ color: colors.text[theme].secondary }}>
              {pendingInvites.length} pending
            </Text>
          )}
        </Row>
        <Separator />
        {invitesLoading ? (
          <Paragraph>Loading invitations…</Paragraph>
        ) : pendingInvites.length === 0 ? (
          <Paragraph style={{ color: colors.text[theme].secondary }}>
            No pending invitations
          </Paragraph>
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
                    <Paragraph style={{ color: colors.text[theme].secondary }}>
                      {invite.role_name ?? 'member'}
                    </Paragraph>
                  </Stack>
                  <Text style={{ color: colors.text[theme].secondary }}>{invite.status}</Text>
                </Row>
              )
            )}
          </Stack>
        )}
      </Card>
    </Stack>
  )
}
