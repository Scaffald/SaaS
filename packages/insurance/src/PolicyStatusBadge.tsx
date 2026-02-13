/**
 * PolicyStatusBadge - Status indicator for insurance policies
 */

import { Row, Text } from '@scaffald/ui'
import { colors, spacing, borderRadius } from '@scaffald/ui/tokens'
import type { RowProps } from '@scaffald/ui'
import {
  Shield,
  Clock,
  AlertTriangle,
  XCircle,
  CheckCircle,
  PauseCircle,
  RefreshCw,
} from 'lucide-react-native'
import type { ComponentType } from 'react'

export type PolicyStatus =
  | 'active'
  | 'pending'
  | 'expired'
  | 'cancelled'
  | 'in-force'
  | 'bound'
  | 'quoted'
  | 'renewed'
  | 'non-renewed'
  | 'suspended'

export interface PolicyStatusBadgeProps extends Omit<RowProps, 'children'> {
  status: PolicyStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  label?: string
}

const statusConfig: Record<
  PolicyStatus,
  {
    label: string
    bgColor: string
    textColor: string
    icon: ComponentType<{ size: number; color: string }>
  }
> = {
  active: {
    label: 'Active',
    bgColor: colors.success[100],
    textColor: colors.success[700],
    icon: CheckCircle,
  },
  'in-force': {
    label: 'In Force',
    bgColor: colors.success[100],
    textColor: colors.success[700],
    icon: Shield,
  },
  bound: {
    label: 'Bound',
    bgColor: colors.info[100],
    textColor: colors.info[700],
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending',
    bgColor: colors.warning[100],
    textColor: colors.warning[700],
    icon: Clock,
  },
  quoted: {
    label: 'Quoted',
    bgColor: colors.violet[100],
    textColor: colors.violet[700],
    icon: Clock,
  },
  renewed: {
    label: 'Renewed',
    bgColor: colors.success[100],
    textColor: colors.success[700],
    icon: RefreshCw,
  },
  expired: {
    label: 'Expired',
    bgColor: colors.orange[100],
    textColor: colors.orange[700],
    icon: AlertTriangle,
  },
  'non-renewed': {
    label: 'Non-Renewed',
    bgColor: colors.orange[100],
    textColor: colors.orange[700],
    icon: AlertTriangle,
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: colors.error[100],
    textColor: colors.error[700],
    icon: XCircle,
  },
  suspended: {
    label: 'Suspended',
    bgColor: colors.gray[200],
    textColor: colors.gray[700],
    icon: PauseCircle,
  },
}

const sizeConfig = {
  sm: { paddingHorizontal: spacing[4], paddingVertical: 2, fontSize: 'xs' as const, iconSize: 10, gap: spacing[4] },
  md: { paddingHorizontal: spacing[8], paddingVertical: spacing[4], fontSize: 'sm' as const, iconSize: 12, gap: spacing[4] },
  lg: { paddingHorizontal: spacing[12], paddingVertical: spacing[8], fontSize: 'md' as const, iconSize: 14, gap: spacing[8] },
}

export function PolicyStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  label,
  ...props
}: PolicyStatusBadgeProps) {
  const config = statusConfig[status]
  const sizeStyles = sizeConfig[size]
  const IconComponent = config.icon

  return (
    <Row
      align="center"
      gap={sizeStyles.gap}
      style={{
        borderRadius: borderRadius.max,
        backgroundColor: config.bgColor,
        paddingHorizontal: sizeStyles.paddingHorizontal,
        paddingVertical: sizeStyles.paddingVertical,
      }}
      {...props}
    >
      {showIcon && <IconComponent size={sizeStyles.iconSize} color={config.textColor} />}
      <Text size={sizeStyles.fontSize} weight="medium" style={{ color: config.textColor }}>
        {label ?? config.label}
      </Text>
    </Row>
  )
}
