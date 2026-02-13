/**
 * CardBadges component
 * Displays badge chips
 */

import type React from 'react'
import { Row } from '../Layout'
import { Text } from '../Typography'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens'

export interface BadgeConfig {
  key: string
  label: string
  backgroundColor?: string
  color?: string
  icon?: React.ReactElement
}

export interface CardBadgesProps {
  /** Array of badges to display */
  badges: BadgeConfig[]
  /** Maximum number of badges to show */
  maxBadges?: number
  /** Wrap badges to multiple lines */
  wrap?: boolean
  /** Gap between badges */
  gap?: number
}

/**
 * CardBadges - Display badge chips
 *
 * @example
 * ```tsx
 * <CardBadges
 *   badges={[
 *     { key: 'cert1', label: 'AWS Certified', backgroundColor: '#ff0000' },
 *     { key: 'skill1', label: 'React', backgroundColor: '#0000ff' }
 *   ]}
 *   maxBadges={3}
 * />
 * ```
 */
export function CardBadges({
  badges,
  maxBadges,
  wrap = true,
  gap = 8,
}: CardBadgesProps): React.ReactElement {
  const { theme } = useThemeContext()
  const displayBadges = maxBadges ? badges.slice(0, maxBadges) : badges
  const remainingCount = maxBadges && badges.length > maxBadges
    ? badges.length - maxBadges
    : 0

  return (
    <Row gap={gap} wrap={wrap}>
      {displayBadges.map((badge) => (
        <Row
          key={badge.key}
          paddingHorizontal={8}
          paddingVertical={4}
          borderRadius={8}
          gap={4}
          align="center"
          style={{
            backgroundColor: badge.backgroundColor || colors.bg[theme].emphasis,
          }}
        >
          {badge.icon}
          <Text
            size="sm"
            weight="medium"
            style={{
              color: badge.color || colors.text[theme].primary,
            }}
          >
            {badge.label}
          </Text>
        </Row>
      ))}
      {remainingCount > 0 && (
        <Row
          paddingHorizontal={8}
          paddingVertical={4}
          borderRadius={8}
          style={{
            backgroundColor: colors.bg[theme].subtle,
          }}
        >
          <Text
            size="sm"
            weight="medium"
            style={{ color: colors.text[theme].secondary }}
          >
            +{remainingCount}
          </Text>
        </Row>
      )}
    </Row>
  )
}
