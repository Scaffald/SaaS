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
      <XStack gap="$2" flexWrap="wrap" alignItems="center">
        {displayBadges.map((badge) => {
          const chipProps = {
            backgroundColor: badge.bg ?? '$blue10',
            color: typeof badge.color === 'string' ? badge.color : '$color1',
            fontSize: '$2' as const,
            paddingHorizontal: '$2' as const,
            paddingVertical: '$1' as const,
          }
          const chipContent = badge.icon ? (
            <XStack alignItems="center" gap="$1">
              <XStack marginRight="$1" alignItems="center">
                {badge.icon}
              </XStack>
              {badge.label}
            </XStack>
          ) : (
            badge.label
          )
          const ChipWithKey = Chip as any
          return (
            <ChipWithKey key={badge.key} {...chipProps}>
              {chipContent as any}
            </ChipWithKey>
          )
        })}
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
