/**
 * CoverageTable - Display coverage details for an insurance policy
 */

import { Stack, Row, Box, Text } from '@scaffald/ui'
import { colors, spacing, borderRadius } from '@scaffald/ui/tokens'
import type { StackProps } from '@scaffald/ui'
import { Check, X, AlertCircle } from 'lucide-react-native'
import { View } from 'react-native'

export interface Coverage {
  id: string
  name: string
  description?: string
  limit?: number | string
  deductible?: number | string
  premium?: number
  included: boolean
  notes?: string
}

export interface CoverageTableProps extends Omit<StackProps, 'children'> {
  coverages: Coverage[]
  showPremium?: boolean
  showDeductible?: boolean
  title?: string
}

function formatCurrency(amount: number | string): string {
  if (typeof amount === 'string') return amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function CoverageTable({
  coverages,
  showPremium = false,
  showDeductible = true,
  title,
  ...props
}: CoverageTableProps) {
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
      {title && (
        <Row
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
        </Row>
      )}

      <Row
        style={{
          padding: spacing[12],
          backgroundColor: colors.gray[200],
          borderBottomWidth: 1,
          borderBottomColor: colors.border?.default ?? colors.gray[200],
          gap: spacing[8],
        }}
      >
        <View style={{ flex: 3 }}>
          <Text size="sm" weight="semibold" style={{ color: colors.gray[700], textTransform: 'uppercase' }}>
            Coverage
          </Text>
        </View>
        <View style={{ flex: 2 }}>
          <Text size="sm" weight="semibold" style={{ color: colors.gray[700], textTransform: 'uppercase' }}>
            Limit
          </Text>
        </View>
        {showDeductible && (
          <View style={{ flex: 1 }}>
            <Text size="sm" weight="semibold" style={{ color: colors.gray[700], textTransform: 'uppercase' }}>
              Deductible
            </Text>
          </View>
        )}
        {showPremium && (
          <View style={{ flex: 1 }}>
            <Text size="sm" weight="semibold" style={{ color: colors.gray[700], textTransform: 'uppercase' }}>
              Premium
            </Text>
          </View>
        )}
        <View style={{ width: 60, alignItems: 'center' }}>
          <Text size="sm" weight="semibold" style={{ color: colors.gray[700], textTransform: 'uppercase' }}>
            Status
          </Text>
        </View>
      </Row>

      {coverages.map((coverage, index) => (
        <Row
          key={coverage.id}
          align="center"
          gap={spacing[8]}
          style={{
            padding: spacing[12],
            borderBottomWidth: index === coverages.length - 1 ? 0 : 1,
            borderBottomColor: colors.border?.default ?? colors.gray[200],
          }}
        >
          <View style={{ flex: 3 }}>
            <Stack gap={spacing[4]}>
              <Text size="md" weight="medium" style={{ color: colors.gray[800] }}>
                {coverage.name}
              </Text>
              {coverage.description && (
                <Text size="sm" style={{ color: colors.gray[500], marginTop: spacing[4] }}>
                  {coverage.description}
                </Text>
              )}
              {coverage.notes && (
                <Row align="center" gap={spacing[4]} style={{ marginTop: spacing[4] }}>
                  <AlertCircle size={12} color={colors.warning[700]} />
                  <Text size="sm" style={{ color: colors.warning[700], fontStyle: 'italic' }}>
                    {coverage.notes}
                  </Text>
                </Row>
              )}
            </Stack>
          </View>
          <View style={{ flex: 2 }}>
            <Text size="md" style={{ color: colors.gray[700] }}>
              {coverage.limit !== undefined ? formatCurrency(coverage.limit) : '-'}
            </Text>
          </View>
          {showDeductible && (
            <View style={{ flex: 1 }}>
              <Text size="md" style={{ color: colors.gray[700] }}>
                {coverage.deductible !== undefined ? formatCurrency(coverage.deductible) : '-'}
              </Text>
            </View>
          )}
          {showPremium && (
            <View style={{ flex: 1 }}>
              <Text size="md" style={{ color: colors.gray[700] }}>
                {coverage.premium !== undefined ? formatCurrency(coverage.premium) : '-'}
              </Text>
            </View>
          )}
          <View style={{ width: 60, alignItems: 'center' }}>
            <Box
              style={{
                width: 24,
                height: 24,
                borderRadius: borderRadius.max,
                backgroundColor: coverage.included ? colors.success[100] : colors.error[100],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {coverage.included ? (
                <Check size={14} color={colors.success[700]} />
              ) : (
                <X size={14} color={colors.error[700]} />
              )}
            </Box>
          </View>
        </Row>
      ))}
    </Stack>
  )
}
