/**
 * ParticipantsTable - Display compliance participants and their status
 * Beyond UI Component Library
 */

import { Stack, Row, Text, Box } from '@unicornlove/beyond-ui'
import { colors, spacing, borderRadius } from '@unicornlove/beyond-ui/tokens'
import type { StackProps } from '@unicornlove/beyond-ui'
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
} from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import type { ComponentType } from 'react'

export type ParticipantType = 'individual' | 'organization'
export type ComplianceStatus = 'compliant' | 'pending' | 'at-risk' | 'non-compliant'

export interface Participant {
  id: string
  name: string
  type: ParticipantType
  email?: string
  phone?: string
  role?: string
  status: ComplianceStatus
  score?: number
  lastActivity?: string
  pendingItems?: number
}

export interface ParticipantsTableProps extends Omit<StackProps, 'children'> {
  participants: Participant[]
  title?: string
  onParticipantPress?: (participant: Participant) => void
  showContactInfo?: boolean
  showScores?: boolean
}

const statusConfig: Record<
  ComplianceStatus,
  { label: string; bgColor: string; textColor: string; icon: ComponentType<{ size: number; color: string }> }
> = {
  compliant: {
    label: 'Compliant',
    bgColor: colors.green[100],
    textColor: colors.green[700],
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending',
    bgColor: colors.yellow[100],
    textColor: colors.yellow[700],
    icon: Clock,
  },
  'at-risk': {
    label: 'At Risk',
    bgColor: colors.orange[100],
    textColor: colors.orange[700],
    icon: AlertTriangle,
  },
  'non-compliant': {
    label: 'Non-Compliant',
    bgColor: colors.red[100],
    textColor: colors.red[700],
    icon: XCircle,
  },
}

function getScoreLevel(score: number): 'good' | 'warning' | 'danger' {
  if (score >= 70) return 'good'
  if (score >= 50) return 'warning'
  return 'danger'
}

function getScoreColor(level: 'good' | 'warning' | 'danger'): string {
  switch (level) {
    case 'good':
      return colors.green[700]
    case 'warning':
      return colors.yellow[700]
    case 'danger':
      return colors.red[700]
  }
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
    <Stack
      style={{
        backgroundColor: colors.bg.light.default,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border.light.default,
        overflow: 'hidden',
      }}
      {...props}
    >
      <Row
        padding={spacing[3]}
        style={{
          backgroundColor: colors.gray[50],
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light.default,
        }}
        alignItems="center"
        justifyContent="space-between"
      >
        <Text size="sm" weight="semibold" style={{ color: colors.gray[900] }}>
          {title}
        </Text>
        <Text
          size="xs"
          style={{
            color: colors.gray[500],
            backgroundColor: colors.gray[100],
            paddingHorizontal: spacing[2],
            paddingVertical: spacing[1],
            borderRadius: 9999,
          }}
        >
          {participants.length}
        </Text>
      </Row>

      <Row
        padding={spacing[3]}
        style={{
          backgroundColor: colors.gray[100],
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light.default,
        }}
        gap={spacing[2]}
      >
        <View style={{ flex: 3 }}>
          <Text
            size="xs"
            weight="semibold"
            style={{ color: colors.gray[700], textTransform: 'uppercase' }}
          >
            Participant
          </Text>
        </View>
        {showScores && (
          <View style={{ flex: 1 }}>
            <Text
              size="xs"
              weight="semibold"
              style={{ color: colors.gray[700], textTransform: 'uppercase' }}
            >
              Score
            </Text>
          </View>
        )}
        <View style={{ flex: 2 }}>
          <Text
            size="xs"
            weight="semibold"
            style={{ color: colors.gray[700], textTransform: 'uppercase' }}
          >
            Status
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </Row>

      {participants.length === 0 ? (
        <Stack padding={spacing[6]} alignItems="center" gap={spacing[2]}>
          <User size={32} color={colors.gray[400]} />
          <Text size="sm" style={{ color: colors.gray[500] }}>
            No participants
          </Text>
        </Stack>
      ) : (
        participants.map((participant, index) => {
          const StatusIcon = statusConfig[participant.status].icon
          const isLast = index === participants.length - 1
          return (
            <Pressable
              key={participant.id}
              onPress={() => onParticipantPress?.(participant)}
              style={{
                flexDirection: 'row',
                padding: spacing[3],
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: colors.border.light.default,
                gap: spacing[2],
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 3 }}>
                <Row gap={spacing[3]} alignItems="center">
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor:
                        participant.type === 'individual' ? colors.blue[100] : colors.violet[100],
                    }}
                  >
                    {participant.type === 'individual' ? (
                      <User size={18} color={colors.blue[600]} />
                    ) : (
                      <Building size={18} color={colors.violet[600]} />
                    )}
                  </View>
                  <Stack gap={2}>
                    <Text size="sm" weight="medium" style={{ color: colors.gray[900] }}>
                      {participant.name}
                    </Text>
                    {participant.role && (
                      <Text size="xs" style={{ color: colors.gray[500] }}>
                        {participant.role}
                      </Text>
                    )}
                    {showContactInfo && (participant.email || participant.phone) && (
                      <Row gap={spacing[2]} flexWrap="wrap">
                        {participant.email && (
                          <Row alignItems="center" gap={spacing[1]}>
                            <Mail size={10} color={colors.gray[500]} />
                            <Text size="xs" style={{ color: colors.gray[500] }}>
                              {participant.email}
                            </Text>
                          </Row>
                        )}
                        {participant.phone && (
                          <Row alignItems="center" gap={spacing[1]}>
                            <Phone size={10} color={colors.gray[500]} />
                            <Text size="xs" style={{ color: colors.gray[500] }}>
                              {participant.phone}
                            </Text>
                          </Row>
                        )}
                      </Row>
                    )}
                  </Stack>
                </Row>
              </View>

              {showScores && (
                <View style={{ flex: 1 }}>
                  {participant.score !== undefined ? (
                    <Text
                      size="sm"
                      weight="semibold"
                      style={{ color: getScoreColor(getScoreLevel(participant.score)) }}
                    >
                      {participant.score}%
                    </Text>
                  ) : (
                    <Text size="sm" style={{ color: colors.gray[400] }}>
                      -
                    </Text>
                  )}
                </View>
              )}

              <View style={{ flex: 2 }}>
                <Row gap={spacing[2]} alignItems="center">
                  <Row
                    paddingHorizontal={spacing[2]}
                    paddingVertical={spacing[1]}
                    borderRadius={9999}
                    alignItems="center"
                    gap={spacing[1]}
                    style={{ backgroundColor: statusConfig[participant.status].bgColor }}
                  >
                    <StatusIcon
                      size={12}
                      color={statusConfig[participant.status].textColor}
                    />
                    <Text
                      size="xs"
                      weight="medium"
                      style={{ color: statusConfig[participant.status].textColor }}
                    >
                      {statusConfig[participant.status].label}
                    </Text>
                  </Row>
                  {participant.pendingItems !== undefined && participant.pendingItems > 0 && (
                    <Row
                      style={{
                        backgroundColor: colors.yellow[100],
                        paddingHorizontal: spacing[2],
                        paddingVertical: spacing[1],
                        borderRadius: 9999,
                      }}
                    >
                      <Text size="xs" weight="medium" style={{ color: colors.yellow[700] }}>
                        {participant.pendingItems} pending
                      </Text>
                    </Row>
                  )}
                </Row>
              </View>

              <View style={{ width: 24 }}>
                <ChevronRight size={16} color={colors.gray[400]} />
              </View>
            </Pressable>
          )
        })
      )}
    </Stack>
  )
}
