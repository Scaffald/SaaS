import type { AppRouter } from '@scf/supabase/client-types'
import { Briefcase, Mail, Shield, Users } from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import type { ReactNode } from 'react'
import { Card, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
      padding="$4"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$4"
      backgroundColor="$color2"
    >
      <Row gap="$4" justifyContent="space-between" flexWrap="wrap">
        <Stack gap="$2" flex={1} style={{ minWidth: 240 }}>
          <Row gap="$2" alignItems="center" flexWrap="wrap">
            <Text fontSize="$8" fontWeight="700">
              {team.name || 'Untitled team'}
            </Text>
            {team.isArchived ? <Chip tone="warning">Archived</Chip> : null}
          </Row>
          <Text color="$color11">
            {team.description?.trim() ||
              'No description provided. Add context to help team members understand the focus of this team.'}
          </Text>
        </Stack>
        {actions ? (
          <Row gap="$2" alignItems="flex-start" flexShrink={0} flexWrap="wrap">
            {actions}
          </Row>
        ) : null}
      </Row>

      <Row gap="$2" flexWrap="wrap">
        <Chip>{purposeLabel}</Chip>
        <Chip>{visibilityLabel}</Chip>
        <Chip>{invitationPolicyLabel}</Chip>
      </Row>

      <Row gap="$4" flexWrap="wrap">
        <StatItem
          icon={<Users size={16} />}
          label="Members"
          value={memberCount !== undefined ? memberCount.toString() : '—'}
        />
        <StatItem
          icon={<Briefcase size={16} />}
          label="Active jobs"
          value={jobCount !== undefined ? jobCount.toString() : '—'}
        />
        <StatItem
          icon={<Mail size={16} />}
          label="Pending invites"
          value={pendingInvitations !== undefined ? pendingInvitations.toString() : '—'}
        />
        {team.defaultRole?.name ? (
          <StatItem
            icon={<Shield size={16} />}
            label="Default role"
            value={team.defaultRole.name}
          />
        ) : null}
      </Row>

      <Stack gap="$1">
        <Text fontSize="$2" color="$color10" textTransform="uppercase">
          Team slug
        </Text>
        <Text fontWeight="600" color="$color12">
          {team.slug || 'Not configured'}
        </Text>
      </Stack>
    </Card>
  )
}

function StatItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Row
      gap="$2"
      alignItems="center"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$4"
      paddingHorizontal="$3"
      paddingVertical="$2"
      backgroundColor="$color3"
    >
      {icon}
      <Stack>
        <Text fontSize="$2" color="$color10" textTransform="uppercase">
          {label}
        </Text>
        <Text fontWeight="600">{value}</Text>
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
  const background = tone === 'warning' ? '$yellow4' : '$color3'
  const border = tone === 'warning' ? '$yellow8' : '$borderColor'
  const textColor = tone === 'warning' ? '$yellow11' : '$color11'
  return (
    <Row
      gap="$2"
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderWidth={1}
      borderColor={border}
      backgroundColor={background}
      borderRadius="$4"
    >
      <Text fontSize="$2" color={textColor}>
        {children}
      </Text>
    </Row>
  )
}
