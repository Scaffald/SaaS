import { memo } from 'react'
import { Text, XStack } from 'tamagui'
import type { CardMetadataProps } from './types'

/**
 * CardMetadata - Standardized metadata display component
 *
 * Displays a row of metadata items with icons (e.g., location, date, etc.)
 *
 * @example
 * ```tsx
 * <CardMetadata
 *   items={[
 *     { key: 'loc', icon: <MapPin />, label: 'San Francisco' },
 *     { key: 'exp', icon: <Clock />, label: '5 years' }
 *   ]}
 * />
 * ```
 */
export const CardMetadata = memo(({ items, isSelected = false, maxItems }: CardMetadataProps) => {
  const textColor = isSelected ? '$color1' : '$color10'
  const displayItems = maxItems ? items.slice(0, maxItems) : items

  if (items.length === 0) {
    return null
  }

  return (
    <XStack gap="$3" flexWrap="wrap" items="center">
      {displayItems.map((item) => (
        <XStack key={item.key} items="center" gap="$1.5">
          {item.icon}
          <Text fontSize="$2" color={item.color ?? textColor}>
            {item.label}
          </Text>
        </XStack>
      ))}
      {maxItems && items.length > maxItems && (
        <Text fontSize="$2" color={textColor}>
          +{items.length - maxItems} more
        </Text>
      )}
    </XStack>
  )
})

CardMetadata.displayName = 'CardMetadata'
