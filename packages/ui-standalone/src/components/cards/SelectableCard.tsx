import { forwardRef, memo } from 'react'
import type { TamaguiElement } from 'tamagui'
import { useTheme, YStack } from 'tamagui'
import { borderRadius } from '../../config/radii'
import { cardShadows } from '../../config/shadows'
import { spacing } from '../../config/spacing'
import type { SelectableCardProps } from './types'

/**
 * SelectableCard - Professional card component with teal selection states
 *
 * Foundation card component featuring Scaffald's teal brand color for selections.
 * Provides consistent selection, hover, and press states with smooth animations.
 *
 * Design Tokens Used:
 * - Colors: $blue7 (primary), $blue2 (selected bg), $blue3 (hover), $blue8 (hover border)
 * - Shadows: cardShadows.light, cardShadows.dark
 * - Border radius: borderRadius.md
 * - Spacing: spacing.md, spacing.sm (defaults)
 *
 * States:
 * - Default: Light background with subtle border
 * - Selected: Teal accent with 2px border, light teal background
 * - Hover: Enhanced shadow, darker border (teal if selected)
 * - Press: Slight scale reduction with pressed shadow
 * - Disabled: 50% opacity, not-allowed cursor
 *
 * @example
 * ```tsx
 * // Basic selectable card
 * <SelectableCard
 *   id="card-1"
 *   isSelected={selectedId === "card-1"}
 *   onPress={() => setSelectedId("card-1")}
 *   selection={{ enabled: true }}
 * >
 *   <CardHeader title="Example" />
 *   <CardMetadata items={[...]} />
 * </SelectableCard>
 *
 * // With custom padding and gap
 * <SelectableCard
 *   id="card-2"
 *   isSelected={false}
 *   padding={spacing.lg}
 *   gap={spacing.md}
 * >
 *   <Text>Custom spacing</Text>
 * </SelectableCard>
 * ```
 */
export const SelectableCard = memo(
  forwardRef<TamaguiElement, SelectableCardProps>(
    (
      {
        id,
        isSelected = false,
        onPress,
        disabled = false,
        selection,
        padding = spacing.md,
        gap = spacing.sm,
        children,
        ...rest
      },
      forwardedRef
    ) => {
      const theme = useTheme()
      const isSelectionEnabled = selection?.enabled ?? false

      // Determine if we're in dark mode
      const isDark = theme.background.val.includes('8%')

      // Use teal theme tokens for selection (matching Scaffald brand)
      const borderColor = isSelected
        ? (selection?.selectedBorderColor ?? '$blue7') // Primary teal
        : '$borderColor'

      const bgColor = isSelected
        ? (selection?.selectedBgColor ?? '$blue2') // Light teal background
        : '$background'

      // Use design token shadows
      const shadow = isSelected
        ? isDark
          ? cardShadows.dark
          : cardShadows.light
        : isDark
          ? cardShadows.dark
          : cardShadows.light

      return (
        <YStack
          ref={(node) => {
            // Forward to parent ref
            if (typeof forwardedRef === 'function') {
              forwardedRef(node)
            } else if (forwardedRef) {
              forwardedRef.current = node
            }
          }}
          borderWidth={isSelected ? 2 : 1}
          borderColor={borderColor}
          rounded={borderRadius.md}
          p={padding}
          bg={bgColor}
          gap={gap}
          opacity={disabled ? 0.5 : 1}
          cursor={disabled ? 'not-allowed' : 'pointer'}
          boxShadow={shadow}
          animation="quick"
          animateOnly={['backgroundColor', 'borderColor', 'transform']}
          pressStyle={
            !disabled
              ? {
                  scale: 0.98,
                  boxShadow: isDark ? cardShadows.darkPress : cardShadows.lightPress,
                }
              : undefined
          }
          hoverStyle={
            !disabled
              ? {
                  bg: isSelected ? '$blue3' : '$backgroundHover',
                  borderColor: isSelected ? '$blue8' : '$borderColorHover',
                  boxShadow: isDark ? cardShadows.darkHover : cardShadows.lightHover,
                }
              : undefined
          }
          onPress={!disabled ? onPress : undefined}
          {...rest}
        >
          {children}
        </YStack>
      )
    }
  )
)

SelectableCard.displayName = 'SelectableCard'
