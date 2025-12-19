/**
 * PolicyCard - Insurance policy summary card component
 */

import { styled, YStack, XStack, Text, type YStackProps } from 'tamagui'
import { Calendar, DollarSign, Shield } from '@tamagui/lucide-icons'

export interface PolicyCardProps extends Omit<YStackProps, 'children'> {
  /** Policy number */
  policyNumber: string
  /** Insured name */
  insuredName: string
  /** Policy type (e.g., "General Liability", "Workers Comp") */
  policyType: string
  /** Policy status */
  status: 'active' | 'pending' | 'expired' | 'cancelled'
  /** Effective date */
  effectiveDate: string
  /** Expiration date */
  expirationDate: string
  /** Premium amount */
  premium?: number
  /** Coverage limit */
  coverageLimit?: number
  /** Click handler */
  onPress?: () => void
}

const statusColors = {
  active: '$green7',
  pending: '$yellow7',
  expired: '$red7',
  cancelled: '$gray7',
} as const

const statusLabels = {
  active: 'Active',
  pending: 'Pending',
  expired: 'Expired',
  cancelled: 'Cancelled',
} as const

const CardContainer = styled(YStack, {
  name: 'PolicyCard',
  padding: '$4',
  backgroundColor: '$background',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderColor',
  gap: '$3',
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$color2',
    borderColor: '$color6',
  },

  pressStyle: {
    scale: 0.98,
    backgroundColor: '$color3',
  },
})

const CardHeader = styled(XStack, {
  name: 'PolicyCardHeader',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
})

const PolicyInfo = styled(YStack, {
  name: 'PolicyInfo',
  gap: '$1',
})

const PolicyNumber = styled(Text, {
  name: 'PolicyNumber',
  fontSize: '$2',
  color: '$color9',
  fontFamily: '$mono',
})

const InsuredName = styled(Text, {
  name: 'InsuredName',
  fontSize: '$5',
  fontWeight: '600',
  color: '$color12',
})

const PolicyType = styled(Text, {
  name: 'PolicyType',
  fontSize: '$3',
  color: '$color10',
})

const StatusBadge = styled(XStack, {
  name: 'StatusBadge',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
  alignItems: 'center',
  gap: '$1',

  variants: {
    status: {
      active: {
        backgroundColor: '$green3',
      },
      pending: {
        backgroundColor: '$yellow3',
      },
      expired: {
        backgroundColor: '$red3',
      },
      cancelled: {
        backgroundColor: '$gray3',
      },
    },
  } as const,
})

const StatusText = styled(Text, {
  name: 'StatusText',
  fontSize: '$2',
  fontWeight: '500',

  variants: {
    status: {
      active: {
        color: '$green11',
      },
      pending: {
        color: '$yellow11',
      },
      expired: {
        color: '$red11',
      },
      cancelled: {
        color: '$gray11',
      },
    },
  } as const,
})

const CardDetails = styled(XStack, {
  name: 'PolicyCardDetails',
  gap: '$4',
  flexWrap: 'wrap',
})

const DetailItem = styled(XStack, {
  name: 'DetailItem',
  alignItems: 'center',
  gap: '$2',
})

const DetailLabel = styled(Text, {
  name: 'DetailLabel',
  fontSize: '$2',
  color: '$color9',
})

const DetailValue = styled(Text, {
  name: 'DetailValue',
  fontSize: '$3',
  color: '$color11',
  fontWeight: '500',
})

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
    <CardContainer onPress={onPress} {...props}>
      <CardHeader>
        <PolicyInfo>
          <PolicyNumber>{policyNumber}</PolicyNumber>
          <InsuredName>{insuredName}</InsuredName>
          <PolicyType>{policyType}</PolicyType>
        </PolicyInfo>
        <StatusBadge status={status}>
          <Shield size={12} color={statusColors[status]} />
          <StatusText status={status}>{statusLabels[status]}</StatusText>
        </StatusBadge>
      </CardHeader>

      <CardDetails>
        <DetailItem>
          <Calendar size={14} color="$color9" />
          <DetailLabel>Effective:</DetailLabel>
          <DetailValue>{formatDate(effectiveDate)}</DetailValue>
        </DetailItem>
        <DetailItem>
          <Calendar size={14} color="$color9" />
          <DetailLabel>Expires:</DetailLabel>
          <DetailValue>{formatDate(expirationDate)}</DetailValue>
        </DetailItem>
        {premium !== undefined && (
          <DetailItem>
            <DollarSign size={14} color="$color9" />
            <DetailLabel>Premium:</DetailLabel>
            <DetailValue>{formatCurrency(premium)}</DetailValue>
          </DetailItem>
        )}
        {coverageLimit !== undefined && (
          <DetailItem>
            <Shield size={14} color="$color9" />
            <DetailLabel>Limit:</DetailLabel>
            <DetailValue>{formatCurrency(coverageLimit)}</DetailValue>
          </DetailItem>
        )}
      </CardDetails>
    </CardContainer>
  )
}
