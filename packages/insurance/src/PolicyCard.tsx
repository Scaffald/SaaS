/**
 * PolicyCard - Insurance policy summary card component
 */

import { Stack, Row, Text } from '@scaffald/ui'
import { colors, spacing, borderRadius } from '@scaffald/ui/tokens'
import type { StackProps } from '@scaffald/ui'
import { Calendar, DollarSign, Shield } from 'lucide-react-native'
import { Pressable } from 'react-native'

export interface PolicyCardProps extends Omit<StackProps, 'children'> {
  policyNumber: string
  insuredName: string
  policyType: string
  status: 'active' | 'pending' | 'expired' | 'cancelled'
  effectiveDate: string
  expirationDate: string
  premium?: number
  coverageLimit?: number
  onPress?: () => void
}

const statusBgColors = {
  active: colors.success[100],
  pending: colors.warning[100],
  expired: colors.error[100],
  cancelled: colors.gray[200],
} as const

const statusTextColors = {
  active: colors.success[700],
  pending: colors.warning[700],
  expired: colors.error[700],
  cancelled: colors.gray[700],
} as const

const statusLabels = {
  active: 'Active',
  pending: 'Pending',
  expired: 'Expired',
  cancelled: 'Cancelled',
} as const

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function PolicyCard({
  policyNumber,
  insuredName,
  policyType,
  status,
  effectiveDate,
  expirationDate,
  premium,
  coverageLimit,
  onPress,
  ...props
}: PolicyCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Stack
        style={{
          padding: spacing[16],
          backgroundColor: colors.bg?.primary ?? colors.gray[50],
          borderRadius: borderRadius.l,
          borderWidth: 1,
          borderColor: colors.border?.default ?? colors.gray[200],
          gap: spacing[12],
        }}
        {...props}
      >
        <Row align="flex-start" justify="space-between">
          <Stack gap={spacing[4]}>
            <Text size="sm" style={{ color: colors.gray[500] }}>
              {policyNumber}
            </Text>
            <Text size="xl" weight="semibold" style={{ color: colors.gray[800] }}>
              {insuredName}
            </Text>
            <Text size="md" style={{ color: colors.gray[600] }}>
              {policyType}
            </Text>
          </Stack>
          <Row
            align="center"
            gap={spacing[4]}
            style={{
              paddingHorizontal: spacing[8],
              paddingVertical: spacing[4],
              borderRadius: borderRadius.max,
              backgroundColor: statusBgColors[status],
            }}
          >
            <Shield size={12} color={statusTextColors[status]} />
            <Text size="sm" weight="medium" style={{ color: statusTextColors[status] }}>
              {statusLabels[status]}
            </Text>
          </Row>
        </Row>

        <Row gap={spacing[16]} wrap>
          <Row align="center" gap={spacing[8]}>
            <Calendar size={14} color={colors.gray[500]} />
            <Text size="sm" style={{ color: colors.gray[500] }}>
              Effective:
            </Text>
            <Text size="md" weight="medium" style={{ color: colors.gray[700] }}>
              {formatDate(effectiveDate)}
            </Text>
          </Row>
          <Row align="center" gap={spacing[8]}>
            <Calendar size={14} color={colors.gray[500]} />
            <Text size="sm" style={{ color: colors.gray[500] }}>
              Expires:
            </Text>
            <Text size="md" weight="medium" style={{ color: colors.gray[700] }}>
              {formatDate(expirationDate)}
            </Text>
          </Row>
          {premium !== undefined && (
            <Row align="center" gap={spacing[8]}>
              <DollarSign size={14} color={colors.gray[500]} />
              <Text size="sm" style={{ color: colors.gray[500] }}>
                Premium:
              </Text>
              <Text size="md" weight="medium" style={{ color: colors.gray[700] }}>
                {formatCurrency(premium)}
              </Text>
            </Row>
          )}
          {coverageLimit !== undefined && (
            <Row align="center" gap={spacing[8]}>
              <Shield size={14} color={colors.gray[500]} />
              <Text size="sm" style={{ color: colors.gray[500] }}>
                Limit:
              </Text>
              <Text size="md" weight="medium" style={{ color: colors.gray[700] }}>
                {formatCurrency(coverageLimit)}
              </Text>
            </Row>
          )}
        </Row>
      </Stack>
    </Pressable>
  )
}
