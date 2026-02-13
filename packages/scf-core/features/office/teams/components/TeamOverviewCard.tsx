import type { AppRouter } from '@scf/supabase/client-types'
import { Briefcase, Mail, Shield, Users } from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import type { ReactNode } from 'react'
import { Card, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type TeamDetailOutput = inferRouterOutputs<AppRouter>['teams']['byId']
type TeamRecord = TeamDetailOutput['team']

interface TeamOverviewStats {
  memberCount?: number
  jobCount?: number
  pendingInvitations?: number
}

interface TeamOverviewCardProps {
  team: TeamRecord
  stats?: TeamOverviewStats
  actions?: ReactNode
}

const PURPOSE_LABELS: Record<string, string> = {
  department: 'Department',
  project: 'Project',
  location: 'Location',
  custom: 'Custom',
}

const VISIBILITY_LABELS: Record<string, string> = {
  organization: 'Org-wide',
  private: 'Private',
}

const INVITATION_POLICY_LABELS: Record<string, string> = {
  open: 'Open',
  request: 'Request access',
  invite_only: 'Invite only',
}

export function TeamOverviewCard({ team, stats, actions }: TeamOverviewCardProps) {
  const { theme } = useThemeContext()
  const purposeLabel = PURPOSE_LABELS[team.purpose ?? ''] ?? 'General'
  const visibilityLabel = VISIBILITY_LABELS[team.visibility ?? ''] ?? 'Org-wide'
  const invitationPolicyLabel =
    INVITATION_POLICY_LABELS[team.invitationPolicy ?? ''] ?? 'Invite only'

  const memberCount = typeof stats?.memberCount === 'number' ? stats.memberCount : undefined
  const jobCount = typeof stats?.jobCount === 'number' ? stats.jobCount : undefined
  const pendingInvitations =
    typeof stats?.pendingInvitations === 'number' ? stats.pendingInvitations : undefined

  return (
    <Card
      padding="md"
      borderWidth={1}
      borderColor={colors.border[theme].default}
      gap={16}
      style={{ backgroundColor: colors.bg[theme].subtle }}
    >
      <Row gap={16} justify="space-between" flexWrap="wrap">
        <Stack gap={8} flex={1} style={{ minWidth: 240 }}>
          <Row gap={8} align="center" flexWrap="wrap">
            <Text>{team.name || 'Untitled team'}</Text>
            {team.isArchived ? <Chip tone="warning">Archived</Chip> : null}
          </Row>
          <Text style={{ color: colors.text[theme].secondary }}>
            {team.description?.trim() ||
              'No description provided. Add context to help team members understand the focus of this team.'}
          </Text>
        </Stack>
        {actions ? (
          <Row gap={8} align="flex-start" flexShrink={0} flexWrap="wrap">
            {actions}
          </Row>
        ) : null}
      </Row>

      <Row gap={8} flexWrap="wrap">
        <Chip>{purposeLabel}</Chip>
        <Chip>{visibilityLabel}</Chip>
        <Chip>{invitationPolicyLabel}</Chip>
      </Row>

      <Row gap={16} flexWrap="wrap">
        <StatItem
          iconStart={<Users size="md" />}
          label="Members"
          value={memberCount !== undefined ? memberCount.toString() : '—'}
        />
        <StatItem
          iconStart={<Briefcase size="md" />}
          label="Active jobs"
          value={jobCount !== undefined ? jobCount.toString() : '—'}
        />
        <StatItem
          iconStart={<Mail size="md" />}
          label="Pending invites"
          value={pendingInvitations !== undefined ? pendingInvitations.toString() : '—'}
        />
        {team.defaultRole?.name ? (
          <StatItem
            iconStart={<Shield size="md" />}
            label="Default role"
            value={team.defaultRole.name}
          />
        ) : null}
      </Row>

      <Stack gap={4}>
        <Text style={{ color: colors.text[theme].secondary }} textTransform="uppercase">
          Team slug
        </Text>
        <Text style={{ color: colors.text[theme].secondary }}>{team.slug || 'Not configured'}</Text>
      </Stack>
    </Card>
  )
}

function StatItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  const { theme } = useThemeContext()
  return (
    <Row
      gap={8}
      align="center"
      borderWidth={1}
      borderColor={colors.border[theme].default}
      borderRadius={16}
      paddingHorizontal={12}
      paddingVertical={8}
      style={{ backgroundColor: colors.bg[theme].muted }}
    >
      {icon}
      <Stack>
        <Text style={{ color: colors.text[theme].secondary }} textTransform="uppercase">
          {label}
        </Text>
        <Text>{value}</Text>
      </Stack>
    </Row>
  )
}

function Chip({
  children,
  tone = 'surface',
}: {
  children: ReactNode
  tone?: 'surface' | 'warning'
}) {
  const { theme } = useThemeContext()
  const background = tone === 'warning' ? colors.bg[theme].warningSubtle : colors.bg[theme].muted
  const border = tone === 'warning' ? colors.border[theme].warning : colors.border[theme].default
  const textColor = tone === 'warning' ? colors.text[theme].warning : colors.text[theme].secondary
  return (
    <Row
      gap={8}
      paddingHorizontal={8}
      paddingVertical={4}
      borderWidth={1}
      borderColor={border}
      backgroundColor={background}
      borderRadius={16}
    >
      <Text color={textColor}>{children}</Text>
    </Row>
  )
}
