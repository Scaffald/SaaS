/**
 * EndorsementList - Display policy endorsements/riders
 */

import { styled, YStack, XStack, Text, type YStackProps } from 'tamagui'
import { FileText, Calendar, ChevronRight } from '@tamagui/lucide-icons'

export interface Endorsement {
  id: string
  /** Endorsement number/code */
  number: string
  /** Endorsement name */
  name: string
  /** Description of what the endorsement does */
  description?: string
  /** Effective date of the endorsement */
  effectiveDate: string
  /** Additional premium (can be negative for credits) */
  premiumChange?: number
  /** Status of the endorsement */
  status: 'active' | 'pending' | 'expired' | 'removed'
}

export interface EndorsementListProps extends Omit<YStackProps, 'children'> {
  /** Array of endorsements */
  endorsements: Endorsement[]
  /** Title for the list */
  title?: string
  /** Callback when an endorsement is clicked */
  onEndorsementPress?: (endorsement: Endorsement) => void
}

const ListContainer = styled(YStack, {
  name: 'EndorsementList',
  backgroundColor: '$background',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderColor',
  overflow: 'hidden',
})

const ListHeader = styled(XStack, {
  name: 'EndorsementListHeader',
  padding: '$3',
  backgroundColor: '$color2',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  alignItems: 'center',
  justifyContent: 'space-between',
})

const ListTitle = styled(Text, {
  name: 'EndorsementListTitle',
  fontSize: '$4',
  fontWeight: '600',
  color: '$color12',
})

const EndorsementCount = styled(Text, {
  name: 'EndorsementCount',
  fontSize: '$2',
  color: '$color9',
  backgroundColor: '$color4',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
})

const EndorsementItem = styled(XStack, {
  name: 'EndorsementItem',
  padding: '$3',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  gap: '$3',
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

const EndorsementIcon = styled(XStack, {
  name: 'EndorsementIcon',
  width: 40,
  height: 40,
  borderRadius: '$md',
  backgroundColor: '$blue3',
  alignItems: 'center',
  justifyContent: 'center',
})

const EndorsementContent = styled(YStack, {
  name: 'EndorsementContent',
  flex: 1,
  gap: '$1',
})

const EndorsementHeader = styled(XStack, {
  name: 'EndorsementHeader',
  alignItems: 'center',
  gap: '$2',
})

const EndorsementNumber = styled(Text, {
  name: 'EndorsementNumber',
  fontSize: '$2',
  color: '$color9',
  fontFamily: '$mono',
})

const EndorsementName = styled(Text, {
  name: 'EndorsementName',
  fontSize: '$3',
  fontWeight: '500',
  color: '$color12',
})

const EndorsementDescription = styled(Text, {
  name: 'EndorsementDescription',
  fontSize: '$2',
  color: '$color9',
  numberOfLines: 2,
})

const EndorsementMeta = styled(XStack, {
  name: 'EndorsementMeta',
  gap: '$3',
  marginTop: '$1',
})

const MetaItem = styled(XStack, {
  name: 'EndorsementMetaItem',
  alignItems: 'center',
  gap: '$1',
})

const MetaText = styled(Text, {
  name: 'EndorsementMetaText',
  fontSize: '$2',
  color: '$color9',
})

const StatusBadge = styled(XStack, {
  name: 'EndorsementStatusBadge',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',

  variants: {
    status: {
      active: {
        backgroundColor: '$green3',
      },
      pending: {
        backgroundColor: '$yellow3',
      },
      expired: {
        backgroundColor: '$gray3',
      },
      removed: {
        backgroundColor: '$red3',
      },
    },
  } as const,
})

const StatusText = styled(Text, {
  name: 'EndorsementStatusText',
  fontSize: '$1',
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
        color: '$gray11',
      },
      removed: {
        color: '$red11',
      },
    },
  } as const,
})

const PremiumChange = styled(Text, {
  name: 'EndorsementPremiumChange',
  fontSize: '$3',
  fontWeight: '500',

  variants: {
    positive: {
      true: {
        color: '$red11',
      },
      false: {
        color: '$green11',
      },
    },
  } as const,
})

const EmptyState = styled(YStack, {
  name: 'EndorsementEmptyState',
  padding: '$6',
  alignItems: 'center',
  gap: '$2',
})

const EmptyText = styled(Text, {
  name: 'EndorsementEmptyText',
  fontSize: '$3',
  color: '$color9',
})

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

const statusLabels = {
  active: 'Active',
  pending: 'Pending',
  expired: 'Expired',
  removed: 'Removed',
} as const

export function EndorsementList({
  endorsements,
  title = 'Endorsements',
  onEndorsementPress,
  ...props
}: EndorsementListProps) {
  return (
    <ListContainer {...props}>
      <ListHeader>
        <ListTitle>{title}</ListTitle>
        <EndorsementCount>{endorsements.length}</EndorsementCount>
      </ListHeader>

      {endorsements.length === 0 ? (
        <EmptyState>
          <FileText size={32} color="$color7" />
          <EmptyText>No endorsements</EmptyText>
        </EmptyState>
      ) : (
        endorsements.map((endorsement, index) => (
          <EndorsementItem
            key={endorsement.id}
            isLast={index === endorsements.length - 1}
            onPress={() => onEndorsementPress?.(endorsement)}
          >
            <EndorsementIcon>
              <FileText size={20} color="$blue10" />
            </EndorsementIcon>

            <EndorsementContent>
              <EndorsementHeader>
                <EndorsementNumber>{endorsement.number}</EndorsementNumber>
                <StatusBadge status={endorsement.status}>
                  <StatusText status={endorsement.status}>
                    {statusLabels[endorsement.status]}
                  </StatusText>
                </StatusBadge>
              </EndorsementHeader>
              <EndorsementName>{endorsement.name}</EndorsementName>
              {endorsement.description && (
                <EndorsementDescription>{endorsement.description}</EndorsementDescription>
              )}
              <EndorsementMeta>
                <MetaItem>
                  <Calendar size={12} color="$color9" />
                  <MetaText>{formatDate(endorsement.effectiveDate)}</MetaText>
                </MetaItem>
              </EndorsementMeta>
            </EndorsementContent>

            {endorsement.premiumChange !== undefined && endorsement.premiumChange !== 0 && (
              <PremiumChange positive={endorsement.premiumChange > 0}>
                {formatCurrency(endorsement.premiumChange)}
              </PremiumChange>
            )}

            <ChevronRight size={16} color="$color7" />
          </EndorsementItem>
        ))
      )}
    </ListContainer>
  )
}
