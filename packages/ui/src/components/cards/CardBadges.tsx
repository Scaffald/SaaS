import { memo } from 'react'
import { Text, XStack } from 'tamagui'
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
 *     { key: '1', label: 'React', bg: '$blue10', color: '$color1' },
 *     { key: '2', label: 'TypeScript', bg: '$blue10', color: '$color1' }
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
      <XStack gap="$2" flexWrap="wrap" items="center">
        {displayBadges.map((badge) => (
          <Chip
            key={badge.key}
            bg={(badge.bg ?? '$blue10') as any}
            color={(badge.color ?? '$color1') as any}
            fontSize="$2"
            px="$2"
            py="$1"
          >
            {badge.icon && (
              <XStack mr="$1" items="center">
                {badge.icon}
              </XStack>
            )}
            {badge.label}
          </Chip>
        ))}
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
