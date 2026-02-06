import { memo } from 'react'
import type { GetThemeValueForKey } from '@tamagui/core'
import { Text } from 'tamagui'
import { XStack } from '@tamagui/stacks'

import { Chip } from '../chips/Chip'
import type { CardBadgesProps } from './types'

/**
 * CardBadges - Standardized badges/chips display component
 *
 * Displays a row of badges with optional overflow indicator
 *
 * @example
 * ```tsx
 * <CardBadges
 *   badges={[
 *     { key: '1', label: 'React', backgroundColor: '$blue10', color: '$color1' },
 *     { key: '2', label: 'TypeScript', backgroundColor: '$blue10', color: '$color1' }
 *   ]}
 *   maxVisible={3}
 * />
 * ```
 */
export const CardBadges = memo(
  ({ badges, isSelected = false, maxVisible = 5 }: CardBadgesProps) => {
    const displayBadges = badges.slice(0, maxVisible)
    const overflowCount = badges.length - maxVisible
    const overflowColor = isSelected ? '$color1' : '$color10'

    if (badges.length === 0) {
      return null
    }

    return (
      <XStack gap="$2" flexWrap="wrap" style={{ alignItems: 'center' }}>
        {displayBadges.map((badge) =>
          badge.icon ? (
            <XStack
              key={badge.key}
              background={badge.bg ?? '$blue10'}
              borderColor={(badge.bg ?? '$blue10') as GetThemeValueForKey<'borderColor'>}
              borderWidth={1}
              style={{
                alignItems: 'center',
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
              gap="$1"
            >
              <XStack style={{ alignItems: 'center' }}>{badge.icon}</XStack>
              <Text fontSize="$2" color={(badge.color as GetThemeValueForKey<'color'>) ?? '$color1'}>
                {badge.label}
              </Text>
            </XStack>
          ) : (
            <Chip
              key={badge.key}
              background={badge.bg ?? '$blue10'}
              color={(badge.color as GetThemeValueForKey<'color'>) ?? '$color1'}
              fontSize="$2"
              style={{ paddingHorizontal: 8, paddingVertical: 4 }}
            >
              {badge.label}
            </Chip>
          )
        )}
        {overflowCount > 0 && (
          <Text fontSize="$2" color={overflowColor}>
            +{overflowCount} more
          </Text>
        )}
      </XStack>
    )
  }
)

CardBadges.displayName = 'CardBadges'
