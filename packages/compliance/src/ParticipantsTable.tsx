/**
 * ParticipantsTable - Display compliance participants and their status
 */

import { styled, YStack, XStack, Text, View, type YStackProps } from 'tamagui'
import {
  User,
  Building,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Mail,
  Phone,
} from '@tamagui/lucide-icons'

export type ParticipantType = 'individual' | 'organization'
export type ComplianceStatus = 'compliant' | 'pending' | 'at-risk' | 'non-compliant'

export interface Participant {
  id: string
  /** Name of the participant */
  name: string
  /** Type of participant */
  type: ParticipantType
  /** Email address */
  email?: string
  /** Phone number */
  phone?: string
  /** Role or title */
  role?: string
  /** Compliance status */
  status: ComplianceStatus
  /** Score (0-100) */
  score?: number
  /** Last activity date */
  lastActivity?: string
  /** Number of pending items */
  pendingItems?: number
}

export interface ParticipantsTableProps extends Omit<YStackProps, 'children'> {
  /** Array of participants */
  participants: Participant[]
  /** Title for the table */
  title?: string
  /** Callback when a participant is clicked */
  onParticipantPress?: (participant: Participant) => void
  /** Whether to show contact info */
  showContactInfo?: boolean
  /** Whether to show scores */
  showScores?: boolean
}

const statusConfig: Record<
  ComplianceStatus,
  { label: string; bgColor: string; textColor: string; icon: typeof CheckCircle }
> = {
  compliant: {
    label: 'Compliant',
    bgColor: '$green3',
    textColor: '$green11',
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending',
    bgColor: '$yellow3',
    textColor: '$yellow11',
    icon: Clock,
  },
  'at-risk': {
    label: 'At Risk',
    bgColor: '$orange3',
    textColor: '$orange11',
    icon: AlertTriangle,
  },
  'non-compliant': {
    label: 'Non-Compliant',
    bgColor: '$red3',
    textColor: '$red11',
    icon: XCircle,
  },
}

const TableContainer = styled(YStack, {
  name: 'ParticipantsTable',
  backgroundColor: '$background',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderColor',
  overflow: 'hidden',
})

const TableHeader = styled(XStack, {
  name: 'ParticipantsTableHeader',
  padding: '$3',
  backgroundColor: '$color2',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  alignItems: 'center',
  justifyContent: 'space-between',
})

const TableTitle = styled(Text, {
  name: 'ParticipantsTableTitle',
  fontSize: '$4',
  fontWeight: '600',
  color: '$color12',
})

const ParticipantCount = styled(Text, {
  name: 'ParticipantCount',
  fontSize: '$2',
  color: '$color9',
  backgroundColor: '$color4',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
})

const HeaderRow = styled(XStack, {
  name: 'ParticipantsHeaderRow',
  padding: '$3',
  backgroundColor: '$color3',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  gap: '$2',
})

const HeaderCell = styled(Text, {
  name: 'ParticipantsHeaderCell',
  fontSize: '$2',
  fontWeight: '600',
  color: '$color11',
  textTransform: 'uppercase',
})

const ParticipantRow = styled(XStack, {
  name: 'ParticipantRow',
  padding: '$3',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  gap: '$2',
  alignItems: 'center',
  cursor: 'pointer',

  variants: {
    isLast: {
      true: {
        borderBottomWidth: 0,
      },
    },
  } as const,

  hoverStyle: {
    backgroundColor: '$color2',
  },

  pressStyle: {
    backgroundColor: '$color3',
  },
})

const Cell = styled(View, {
  name: 'ParticipantCell',
})

const ParticipantIcon = styled(XStack, {
  name: 'ParticipantIcon',
  width: 36,
  height: 36,
  borderRadius: '$full',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    type: {
      individual: {
        backgroundColor: '$blue3',
      },
      organization: {
        backgroundColor: '$purple3',
      },
    },
  } as const,
})

const ParticipantInfo = styled(YStack, {
  name: 'ParticipantInfo',
  gap: 2,
})

const ParticipantName = styled(Text, {
  name: 'ParticipantName',
  fontSize: '$3',
  fontWeight: '500',
  color: '$color12',
})

const ParticipantRole = styled(Text, {
  name: 'ParticipantRole',
  fontSize: '$2',
  color: '$color9',
})

const ContactInfo = styled(XStack, {
  name: 'ParticipantContactInfo',
  gap: '$2',
  flexWrap: 'wrap',
})

const ContactItem = styled(XStack, {
  name: 'ParticipantContactItem',
  alignItems: 'center',
  gap: '$1',
})

const ContactText = styled(Text, {
  name: 'ParticipantContactText',
  fontSize: '$2',
  color: '$color9',
})

const StatusBadge = styled(XStack, {
  name: 'ParticipantStatusBadge',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
  alignItems: 'center',
  gap: '$1',
})

const StatusText = styled(Text, {
  name: 'ParticipantStatusText',
  fontSize: '$2',
  fontWeight: '500',
})

const ScoreText = styled(Text, {
  name: 'ParticipantScoreText',
  fontSize: '$3',
  fontWeight: '600',

  variants: {
    level: {
      good: {
        color: '$green11',
      },
      warning: {
        color: '$yellow11',
      },
      danger: {
        color: '$red11',
      },
    },
  } as const,
})

const PendingBadge = styled(XStack, {
  name: 'PendingBadge',
  backgroundColor: '$yellow3',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
})

const PendingText = styled(Text, {
  name: 'PendingText',
  fontSize: '$2',
  color: '$yellow11',
  fontWeight: '500',
})

const EmptyState = styled(YStack, {
  name: 'ParticipantsEmptyState',
  padding: '$6',
  alignItems: 'center',
  gap: '$2',
})

const EmptyText = styled(Text, {
  name: 'ParticipantsEmptyText',
  fontSize: '$3',
  color: '$color9',
})

function getScoreLevel(score: number): 'good' | 'warning' | 'danger' {
  if (score >= 70) return 'good'
  if (score >= 50) return 'warning'
  return 'danger'
}

export function ParticipantsTable({
  participants,
  title = 'Participants',
  onParticipantPress,
  showContactInfo = false,
  showScores = true,
  ...props
}: ParticipantsTableProps) {
  return (
    <TableContainer {...props}>
      <TableHeader>
        <TableTitle>{title}</TableTitle>
        <ParticipantCount>{participants.length}</ParticipantCount>
      </TableHeader>

      <HeaderRow>
        <Cell flex={3}>
          <HeaderCell>Participant</HeaderCell>
        </Cell>
        {showScores && (
          <Cell flex={1}>
            <HeaderCell>Score</HeaderCell>
          </Cell>
        )}
        <Cell flex={2}>
          <HeaderCell>Status</HeaderCell>
        </Cell>
        <Cell width={24} />
      </HeaderRow>

      {participants.length === 0 ? (
        <EmptyState>
          <User size={32} color="$color7" />
          <EmptyText>No participants</EmptyText>
        </EmptyState>
      ) : (
        participants.map((participant, index) => {
          const StatusIcon = statusConfig[participant.status].icon
          return (
            <ParticipantRow
              key={participant.id}
              isLast={index === participants.length - 1}
              onPress={() => onParticipantPress?.(participant)}
            >
              <Cell flex={3}>
                <XStack gap="$3" alignItems="center">
                  <ParticipantIcon type={participant.type}>
                    {participant.type === 'individual' ? (
                      <User size={18} color="$blue10" />
                    ) : (
                      <Building size={18} color="$purple10" />
                    )}
                  </ParticipantIcon>
                  <ParticipantInfo>
                    <ParticipantName>{participant.name}</ParticipantName>
                    {participant.role && <ParticipantRole>{participant.role}</ParticipantRole>}
                    {showContactInfo && (participant.email || participant.phone) && (
                      <ContactInfo>
                        {participant.email && (
                          <ContactItem>
                            <Mail size={10} color="$color9" />
                            <ContactText>{participant.email}</ContactText>
                          </ContactItem>
                        )}
                        {participant.phone && (
                          <ContactItem>
                            <Phone size={10} color="$color9" />
                            <ContactText>{participant.phone}</ContactText>
                          </ContactItem>
                        )}
                      </ContactInfo>
                    )}
                  </ParticipantInfo>
                </XStack>
              </Cell>

              {showScores && (
                <Cell flex={1}>
                  {participant.score !== undefined ? (
                    <ScoreText level={getScoreLevel(participant.score)}>
                      {participant.score}%
                    </ScoreText>
                  ) : (
                    <Text color="$color7">-</Text>
                  )}
                </Cell>
              )}

              <Cell flex={2}>
                <XStack gap="$2" alignItems="center">
                  <StatusBadge backgroundColor={statusConfig[participant.status].bgColor}>
                    <StatusIcon size={12} color={statusConfig[participant.status].textColor} />
                    <StatusText color={statusConfig[participant.status].textColor}>
                      {statusConfig[participant.status].label}
                    </StatusText>
                  </StatusBadge>
                  {participant.pendingItems !== undefined && participant.pendingItems > 0 && (
                    <PendingBadge>
                      <PendingText>{participant.pendingItems} pending</PendingText>
                    </PendingBadge>
                  )}
                </XStack>
              </Cell>

              <Cell width={24}>
                <ChevronRight size={16} color="$color7" />
              </Cell>
            </ParticipantRow>
          )
        })
      )}
    </TableContainer>
  )
}
