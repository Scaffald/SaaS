/**
 * DiscoverCard – Pressable card for discover/search results
 * Used for job cards, organization cards, employer cards, etc.
 */

import { forwardRef } from 'react'
import { View } from 'react-native'
import { Card } from '../Card'
import { Stack } from '../Layout'
import type { GapValue } from '../Layout'

export type DiscoverCardVariant = 'neutral' | 'info' | 'warning'

export interface DiscoverCardProps {
  children: React.ReactNode
  onPress?: () => void
  variant?: DiscoverCardVariant
  isSelected?: boolean
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  gap?: GapValue | number
  style?: object
  testID?: string
}

export const DiscoverCard = forwardRef<React.ComponentRef<typeof View>, DiscoverCardProps>(
  (
    {
      children,
      onPress,
      variant = 'neutral',
      isSelected = false,
      interactive = true,
      padding = 'md',
      gap = 12,
      style,
      testID,
    },
    ref
  ) => {
    const cardVariant = isSelected ? 'elevated' : 'surface'
    const isPressable = interactive && !!onPress
    return (
      <View ref={ref} style={{ gap: 0 }}>
        <Card
          pressable={isPressable}
          onPress={onPress}
          padding={padding}
          variant={cardVariant}
          style={[
            style,
            variant === 'info' && { borderColor: 'var(--color-blue-9, #3b82f6)' },
            variant === 'warning' && { borderColor: 'var(--color-amber-9, #d97706)' },
          ]}
          testID={testID}
        >
          <Stack gap={typeof gap === 'number' ? gap : 12}>{children}</Stack>
        </Card>
      </View>
    )
  }
)

DiscoverCard.displayName = 'DiscoverCard'
