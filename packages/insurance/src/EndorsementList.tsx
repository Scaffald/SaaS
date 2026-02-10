/**
 * EndorsementList - Display policy endorsements/riders
 */

import { Stack, Row, Box, Text } from '@unicornlove/beyond-ui'
import { colors, spacing, borderRadius } from '@unicornlove/beyond-ui/tokens'
import type { StackProps } from '@unicornlove/beyond-ui'
import { FileText, Calendar, ChevronRight } from 'lucide-react-native'
import { Pressable } from 'react-native'

export interface Endorsement {
  id: string
  number: string
  name: string
  description?: string
  effectiveDate: string
  premiumChange?: number
  status: 'active' | 'pending' | 'expired' | 'removed'
}

export interface EndorsementListProps extends Omit<StackProps, 'children'> {
  endorsements: Endorsement[]
  title?: string
  onEndorsementPress?: (endorsement: Endorsement) => void
}

const statusBgColors = {
  active: colors.success[100],
  pending: colors.warning[100],
  expired: colors.gray[200],
  removed: colors.error[100],
} as const

const statusTextColors = {
  active: colors.success[700],
  pending: colors.warning[700],
  expired: colors.gray[700],
  removed: colors.error[700],
} as const

const statusLabels = {
  active: 'Active',
  pending: 'Pending',
  expired: 'Expired',
  removed: 'Removed',
} as const

function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
  return amount >= 0 ? `+${formatted}` : `-${formatted}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function EndorsementList({
  endorsements,
  title = 'Endorsements',
  onEndorsementPress,
  ...props
}: EndorsementListProps) {
  return (
    <Stack
      style={{
        backgroundColor: colors.bg?.primary ?? colors.gray[50],
        borderRadius: borderRadius.l,
        borderWidth: 1,
        borderColor: colors.border?.default ?? colors.gray[200],
        overflow: 'hidden',
      }}
      {...props}
    >
      <Row
        align="center"
        justify="space-between"
        style={{
          padding: spacing[12],
          backgroundColor: colors.gray[100],
          borderBottomWidth: 1,
          borderBottomColor: colors.border?.default ?? colors.gray[200],
        }}
      >
        <Text size="lg" weight="semibold" style={{ color: colors.gray[800] }}>
          {title}
        </Text>
        <Box
          style={{
            backgroundColor: colors.gray[200],
            paddingHorizontal: spacing[8],
            paddingVertical: spacing[4],
            borderRadius: borderRadius.max,
          }}
        >
          <Text size="sm" style={{ color: colors.gray[500] }}>
            {endorsements.length}
          </Text>
        </Box>
      </Row>

      {endorsements.length === 0 ? (
        <Stack align="center" gap={spacing[8]} style={{ padding: spacing[24] }}>
          <FileText size={32} color={colors.gray[400]} />
          <Text size="md" style={{ color: colors.gray[500] }}>
            No endorsements
          </Text>
        </Stack>
      ) : (
        endorsements.map((endorsement, index) => (
          <Pressable
            key={endorsement.id}
            onPress={() => onEndorsementPress?.(endorsement)}
          >
            <Row
              align="center"
              gap={spacing[12]}
              style={{
                padding: spacing[12],
                borderBottomWidth: index === endorsements.length - 1 ? 0 : 1,
                borderBottomColor: colors.border?.default ?? colors.gray[200],
              }}
            >
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.m,
                  backgroundColor: colors.info[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={20} color={colors.info[600]} />
              </Box>

              <Stack flex={1} gap={spacing[4]}>
                <Row align="center" gap={spacing[8]}>
                  <Text size="sm" style={{ color: colors.gray[500] }}>
                    {endorsement.number}
                  </Text>
                  <Box
                    style={{
                      paddingHorizontal: spacing[8],
                      paddingVertical: spacing[4],
                      borderRadius: borderRadius.max,
                      backgroundColor: statusBgColors[endorsement.status],
                    }}
                  >
                    <Text size="xs" weight="medium" style={{ color: statusTextColors[endorsement.status] }}>
                      {statusLabels[endorsement.status]}
                    </Text>
                  </Box>
                </Row>
                <Text size="md" weight="medium" style={{ color: colors.gray[800] }}>
                  {endorsement.name}
                </Text>
                {endorsement.description && (
                  <Text size="sm" style={{ color: colors.gray[500] }} numberOfLines={2}>
                    {endorsement.description}
                  </Text>
                )}
                <Row align="center" gap={spacing[4]} style={{ marginTop: spacing[4] }}>
                  <Calendar size={12} color={colors.gray[500]} />
                  <Text size="sm" style={{ color: colors.gray[500] }}>
                    {formatDate(endorsement.effectiveDate)}
                  </Text>
                </Row>
              </Stack>

              {endorsement.premiumChange !== undefined && endorsement.premiumChange !== 0 && (
                <Text
                  size="md"
                  weight="medium"
                  style={{
                    color: endorsement.premiumChange > 0 ? colors.error[700] : colors.success[700],
                  }}
                >
                  {formatCurrency(endorsement.premiumChange)}
                </Text>
              )}

              <ChevronRight size={16} color={colors.gray[400]} />
            </Row>
          </Pressable>
        ))
      )}
    </Stack>
  )
}
