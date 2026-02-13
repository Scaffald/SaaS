/**
 * CardMetadata component
 * Displays metadata items with icons
 */

import type React from 'react'
import { Row } from '../Layout'
import { Text } from '../Typography'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens'

export interface MetadataItem {
  key: string
  icon: React.ReactElement
  label: string
  color?: string
}

export interface CardMetadataProps {
  /** Array of metadata items to display */
  items: MetadataItem[]
  /** Whether the card is selected (affects colors) */
  isSelected?: boolean
  /** Wrap items to multiple lines */
  wrap?: boolean
  /** Gap between items */
  gap?: number
}

/**
 * CardMetadata - Display metadata with icons
 *
 * @example
 * ```tsx
 * <CardMetadata
 *   items={[
 *     { key: 'location', icon: <MapPin size={16} />, label: 'San Francisco' },
 *     { key: 'time', icon: <Clock size={16} />, label: '2 hours ago' }
 *   ]}
 * />
 * ```
 */
export function CardMetadata({
  items,
  isSelected = false,
  wrap = true,
  gap = 12,
}: CardMetadataProps): React.ReactElement {
  const { theme } = useThemeContext()

  return (
    <Row gap={gap} wrap={wrap}>
      {items.map((item) => (
        <Row key={item.key} gap={4} align="center">
          {item.icon}
          <Text
            size="sm"
            style={{
              color: item.color || (isSelected
                ? colors.text[theme].quaternary
                : colors.text[theme].secondary),
            }}
          >
            {item.label}
          </Text>
        </Row>
      ))}
    </Row>
  )
}
