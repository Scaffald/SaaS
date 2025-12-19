/**
 * PolicyStatusBadge - Status indicator for insurance policies
 */

import { styled, XStack, Text, type XStackProps } from 'tamagui'
import {
  Shield,
  Clock,
  AlertTriangle,
  XCircle,
  CheckCircle,
  PauseCircle,
  RefreshCw,
} from '@tamagui/lucide-icons'
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

export interface PolicyStatusBadgeProps extends Omit<XStackProps, 'children'> {
  /** Policy status */
  status: PolicyStatus
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show icon */
  showIcon?: boolean
  /** Custom label override */
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
    bgColor: '$green3',
    textColor: '$green11',
    icon: CheckCircle,
  },
  'in-force': {
    label: 'In Force',
    bgColor: '$green3',
    textColor: '$green11',
    icon: Shield,
  },
  bound: {
    label: 'Bound',
    bgColor: '$blue3',
    textColor: '$blue11',
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending',
    bgColor: '$yellow3',
    textColor: '$yellow11',
    icon: Clock,
  },
  quoted: {
    label: 'Quoted',
    bgColor: '$purple3',
    textColor: '$purple11',
    icon: Clock,
  },
  renewed: {
    label: 'Renewed',
    bgColor: '$teal3',
    textColor: '$teal11',
    icon: RefreshCw,
  },
  expired: {
    label: 'Expired',
    bgColor: '$orange3',
    textColor: '$orange11',
    icon: AlertTriangle,
  },
  'non-renewed': {
    label: 'Non-Renewed',
    bgColor: '$orange3',
    textColor: '$orange11',
    icon: AlertTriangle,
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: '$red3',
    textColor: '$red11',
    icon: XCircle,
  },
  suspended: {
    label: 'Suspended',
    bgColor: '$gray3',
    textColor: '$gray11',
    icon: PauseCircle,
  },
}

const sizeConfig = {
  sm: {
    paddingHorizontal: '$1',
    paddingVertical: 2,
    fontSize: '$1',
    iconSize: 10,
    gap: '$1',
  },
  md: {
    paddingHorizontal: '$2',
    paddingVertical: '$1',
    fontSize: '$2',
    iconSize: 12,
    gap: '$1',
  },
  lg: {
    paddingHorizontal: '$3',
    paddingVertical: '$2',
    fontSize: '$3',
    iconSize: 14,
    gap: '$2',
  },
} as const

const BadgeContainer = styled(XStack, {
  name: 'PolicyStatusBadge',
  borderRadius: '$full',
  alignItems: 'center',
})

const BadgeText = styled(Text, {
  name: 'PolicyStatusBadgeText',
  fontWeight: '500',
})

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
    <BadgeContainer
      backgroundColor={config.bgColor}
      paddingHorizontal={sizeStyles.paddingHorizontal}
      paddingVertical={sizeStyles.paddingVertical}
      gap={sizeStyles.gap}
      {...props}
    >
      {showIcon && <IconComponent size={sizeStyles.iconSize} color={config.textColor} />}
      <BadgeText fontSize={sizeStyles.fontSize} color={config.textColor}>
        {label ?? config.label}
      </BadgeText>
    </BadgeContainer>
  )
}
