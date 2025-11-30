import { memo } from 'react'
import { SizableText, useWindowDimensions, XStack, YStack } from 'tamagui'
import type { CardHeaderProps } from './types'

/**
 * CardHeader - Standardized card header component
 *
 * Displays a title, optional subtitle, icon, and badge in a consistent layout.
 *
 * @example
 * ```tsx
 * <CardHeader
 *   title="John Doe"
 *   subtitle="Senior Engineer"
 *   icon={<User size={20} />}
 *   badge={<Chip>Verified</Chip>}
 * />
 * ```
 */
export const CardHeader = memo(
  ({ title, subtitle, icon, badge, isSelected = false }: CardHeaderProps) => {
    // Use window dimensions for text truncation behavior
    // Breakpoint: 800px (matches Tamagui $sm/$md breakpoint)
    const { width } = useWindowDimensions()
    const titleColor = isSelected ? '$color1' : '$color12'
    const subtitleColor = isSelected ? '$color1' : '$color11'
    // Use responsive numberOfLines: 2 lines on small screens, 1 line on larger screens
    const titleNumberOfLines = width <= 800 ? 2 : 1
    const subtitleNumberOfLines = width <= 800 ? 2 : 1

    return (
      <XStack justify="space-between" items="flex-start" gap="$2">
        <XStack items="center" gap="$2" flex={1}>
          {icon && <YStack>{icon}</YStack>}
          <YStack flex={1} gap="$1">
            <SizableText
              size="$5"
              fontWeight="700"
              color={titleColor}
              numberOfLines={titleNumberOfLines}
            >
              {title}
            </SizableText>
            {subtitle &&
              (typeof subtitle === 'string' ? (
                <SizableText size="$3" color={subtitleColor} numberOfLines={subtitleNumberOfLines}>
                  {subtitle}
                </SizableText>
              ) : (
                subtitle
              ))}
          </YStack>
        </XStack>
        {badge && <YStack>{badge}</YStack>}
      </XStack>
    )
  }
)

CardHeader.displayName = 'CardHeader'
