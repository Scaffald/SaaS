import { memo } from 'react'
import { Text } from 'tamagui'
import { XStack } from '@tamagui/stacks'

import type { CardMetadataProps } from './types'

/**
 * CardMetadata - Standardized metadata display component
 *
 * Displays a row of metadata items with icons (e.g., location, date, etc.)
 *
 * @example
 * ```tsx
 * <CardMetadata
 *   alignItems={[
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
    <XStack gap="$3" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
      {displayItems.map((item) => (
        <XStack key={item.key} style={{ alignItems: 'center' }} gap="$1.5">
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
