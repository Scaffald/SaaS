import { memo, forwardRef } from 'react'
import type { TamaguiElement } from 'tamagui'
import { YStack } from 'tamagui'
import type { SelectableCardProps } from './types'

/**
 * SelectableCard - Base card component with selection states
 *
 * This is the foundation for all card variants in the application.
 * It provides consistent selection, hover, and press states while
 * remaining flexible through composition.
 *
 * @example
 * ```tsx
 * <SelectableCard
 *   id="card-1"
 *   isSelected={selectedId === "card-1"}
 *   onPress={() => setSelectedId("card-1")}
 *   selection={{ enabled: true }}
 * >
 *   <CardHeader title="Example" />
 *   <CardMetadata items={[...]} />
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
        padding = '$3',
        gap = '$2',
        children,
        ...rest
      },
      forwardedRef
    ) => {
      const isSelectionEnabled = selection?.enabled ?? false

      // Determine colors based on selection state
      const borderColor = isSelected ? (selection?.selectedBorderColor ?? '$blue9') : '$color5'

      const bgColor = isSelected ? (selection?.selectedBgColor ?? '$blue9') : '$background'

      const shadowStyle = isSelected
        ? (selection?.selectedShadow ?? '0 4px 8px rgba(59, 130, 246, 0.2)')
        : undefined

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
          borderWidth={1}
          borderColor={borderColor}
          rounded="$3"
          p={padding}
          bg={bgColor}
          gap={gap}
          opacity={disabled ? 0.5 : 1}
          cursor={disabled ? 'not-allowed' : 'pointer'}
          pressStyle={!disabled ? { scale: 0.98 } : undefined}
          hoverStyle={
            !disabled
              ? {
                  bg: isSelected ? bgColor : '$color2',
                }
              : undefined
          }
          onPress={!disabled ? onPress : undefined}
          animation={isSelectionEnabled && isSelected ? 'bouncy' : undefined}
          animateOnly={['backgroundColor', 'borderColor']}
          style={shadowStyle ? { boxShadow: shadowStyle } : undefined}
          {...rest}
        >
          {children}
        </YStack>
      )
    }
  )
)

SelectableCard.displayName = 'SelectableCard'
