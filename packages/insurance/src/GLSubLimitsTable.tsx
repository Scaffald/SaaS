/**
 * GLSubLimitsTable - Display GL sub-limits with validation status.
 */

import { Stack, Row, Text, Spinner } from '@unicornlove/beyond-ui'
import { colors, spacing, borderRadius } from '@unicornlove/beyond-ui/tokens'
import type { StackProps } from '@unicornlove/beyond-ui'
import { Check, X, AlertCircle, AlertTriangle } from 'lucide-react-native'
import { Pressable, View } from 'react-native'

export interface GLSubLimitItem {
  id: string
  name: string
  provision_type: string
  requirement: string
  current_value: number | string | boolean | null
  formatted_value: string
  is_valid: boolean
  severity: 'success' | 'warning' | 'error'
  message?: string
}

export interface GLSubLimitsTableProps extends Omit<StackProps, 'children'> {
  items: GLSubLimitItem[]
  title?: string
  isLoading?: boolean
  error?: string | null
  onItemPress?: (item: GLSubLimitItem) => void
}

const severityBg = {
  success: colors.success[100],
  warning: colors.warning[100],
  error: colors.error[100],
} as const

const severityText = {
  success: colors.success[700],
  warning: colors.warning[700],
  error: colors.error[700],
} as const

function getStatusIcon(severity: 'success' | 'warning' | 'error') {
  switch (severity) {
    case 'success':
      return <Check size={12} color={colors.success[700]} />
    case 'warning':
      return <AlertTriangle size={12} color={colors.warning[700]} />
    case 'error':
      return <X size={12} color={colors.error[700]} />
  }
}

function getStatusLabel(severity: 'success' | 'warning' | 'error') {
  switch (severity) {
    case 'success':
      return 'OK'
    case 'warning':
      return 'Warning'
    case 'error':
      return 'Failed'
  }
}

export function GLSubLimitsTable({
  items,
  title = 'General Liability Coverage Details',
  isLoading = false,
  error = null,
  onItemPress,
  ...props
}: GLSubLimitsTableProps) {
  const errorCount = items.filter((item) => item.severity === 'error').length
  const hasRedFlags = errorCount > 0

  if (isLoading) {
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
        <Stack align="center" justify="center" gap={spacing[8]} style={{ padding: spacing[24] }}>
          <Spinner size="lg" />
          <Text size="md" style={{ color: colors.gray?.[500] || '#6b7280' }}>
            Loading coverage details...
          </Text>
        </Stack>
      </Stack>
    )
  }

  if (error) {
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
        <Stack
          gap={spacing[8]}
          style={{
            padding: spacing[16],
            backgroundColor: colors.error[50],
            borderRadius: borderRadius.m,
            margin: spacing[12],
          }}
        >
          <Row align="center" gap={spacing[8]}>
            <AlertCircle size={16} color={colors.error[700]} />
            <Text size="md" style={{ color: colors.error[700] }}>
              Failed to load coverage details
            </Text>
          </Row>
          <Text size="sm" style={{ color: colors.error[600] }}>
            {error}
          </Text>
        </Stack>
      </Stack>
    )
  }

  if (items.length === 0) {
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
        <Stack align="center" style={{ padding: spacing[16] }}>
          <Text size="md" style={{ color: colors.gray[500] }}>
            No coverage provisions found
          </Text>
        </Stack>
      </Stack>
    )
  }

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
          {hasRedFlags && (
            <Row
              align="center"
              gap={spacing[4]}
              style={{
                backgroundColor: colors.error[100],
                paddingHorizontal: spacing[8],
                paddingVertical: spacing[4],
                borderRadius: borderRadius.max,
              }}
            >
              <AlertCircle size={12} color={colors.error[700]} />
              <Text size="sm" weight="semibold" style={{ color: colors.error[700] }}>
                {errorCount} Issue{errorCount > 1 ? 's' : ''}
              </Text>
            </Row>
          )}
        </Row>
      )}

      {hasRedFlags && (
        <Row
          align="center"
          gap={spacing[8]}
          style={{
            padding: spacing[8],
            backgroundColor: colors.error[100],
          }}
        >
          <AlertTriangle size={14} color={colors.error[700]} />
          <Text size="sm" weight="medium" style={{ color: colors.error[700] }}>
            {errorCount} provision{errorCount > 1 ? 's do' : ' does'} not meet minimum requirements
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
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 2.5 }}>
          <Text size="sm" weight="semibold" style={{ color: colors.gray[700], textTransform: 'uppercase' }}>
            Coverage Type
          </Text>
        </View>
        <View style={{ flex: 1.5 }}>
          <Text size="sm" weight="semibold" style={{ color: colors.gray[700], textTransform: 'uppercase' }}>
            Requirement
          </Text>
        </View>
        <View style={{ flex: 1.5 }}>
          <Text size="sm" weight="semibold" style={{ color: colors.gray[700], textTransform: 'uppercase' }}>
            Current Value
          </Text>
        </View>
        <View style={{ width: 90, alignItems: 'center' }}>
          <Text size="sm" weight="semibold" style={{ color: colors.gray[700], textTransform: 'uppercase' }}>
            Status
          </Text>
        </View>
      </Row>

      {items.map((item, index) => (
        <Pressable
          key={item.id}
          onPress={onItemPress ? () => onItemPress(item) : undefined}
        >
          <Row
            align="center"
            gap={spacing[8]}
            style={{
              padding: spacing[12],
              borderBottomWidth: index === items.length - 1 ? 0 : 1,
              borderBottomColor: colors.border?.default ?? colors.gray[200],
              backgroundColor:
                item.severity === 'error'
                  ? colors.error[50]
                  : item.severity === 'warning'
                    ? colors.warning[50]
                    : undefined,
            }}
          >
            <View style={{ flex: 2.5 }}>
              <Stack gap={spacing[4]}>
                <Text size="md" weight="medium" style={{ color: colors.gray[800] }}>
                  {item.name}
                </Text>
                {item.message && item.severity !== 'success' && (
                  <Text size="xs" style={{ color: colors.gray[500], marginTop: spacing[4] }}>
                    {item.message}
                  </Text>
                )}
              </Stack>
            </View>
            <View style={{ flex: 1.5 }}>
              <Text size="sm" style={{ color: colors.gray[500] }}>
                {item.requirement}
              </Text>
            </View>
            <View style={{ flex: 1.5 }}>
              <Text
                size="md"
                weight="medium"
                style={{ color: severityText[item.severity] }}
              >
                {item.formatted_value}
              </Text>
            </View>
            <View style={{ width: 90, alignItems: 'center' }}>
              <Row
                align="center"
                gap={spacing[4]}
                style={{
                  paddingHorizontal: spacing[8],
                  paddingVertical: spacing[4],
                  borderRadius: borderRadius.max,
                  backgroundColor: severityBg[item.severity],
                }}
              >
                {getStatusIcon(item.severity)}
                <Text size="sm" weight="medium" style={{ color: severityText[item.severity] }}>
                  {getStatusLabel(item.severity)}
                </Text>
              </Row>
            </View>
          </Row>
        </Pressable>
      ))}
    </Stack>
  )
}
