import { View, type ViewProps } from '@unicornlove/ui'

export interface ToggleSwitchProps {
  /** Whether the toggle is checked */
  checked: boolean
  /** Callback when toggle state changes */
  onCheckedChange: (checked: boolean) => void
  /** Whether the toggle is disabled */
  disabled?: boolean
  /** Size of the toggle switch */
  size?: 'small' | 'medium' | 'large'
  /** Optional test ID for testing */
  testID?: string
}

// Size styles for the toggle container
const toggleSizeStyles: Record<NonNullable<ToggleSwitchProps['size']>, Partial<ViewProps>> = {
  small: {
    width: 32,
    height: 18,
    borderRadius: 9,
  },
  medium: {
    width: 44,
    height: 24,
    borderRadius: 12,
  },
  large: {
    width: 56,
    height: 30,
    borderRadius: 15,
  },
}

// Size styles for the toggle thumb
const thumbSizeStyles: Record<NonNullable<ToggleSwitchProps['size']>, Partial<ViewProps>> = {
  small: {
    width: 12,
    height: 12,
    borderRadius: 6,
    top: 2,
  },
  medium: {
    width: 18,
    height: 18,
    borderRadius: 9,
    top: 2,
  },
  large: {
    width: 24,
    height: 24,
    borderRadius: 12,
    top: 2,
  },
}

/**
 * ToggleSwitch - A custom animated toggle switch component
 *
 * Features:
 * - Smooth animations for toggle state changes
 * - Multiple sizes (small, medium, large)
 * - Disabled state support
 * - Cross-platform compatible
 * - No nested button conflicts
 *
 * @example
 * ```tsx
 * <ToggleSwitch
 *   checked={isEnabled}
 *   onCheckedChange={setIsEnabled}
 *   size="medium"
 *   disabled={false}
 * />
 * ```
 */
export function ToggleSwitch({
  checked,
  onCheckedChange,
  disabled = false,
  size = 'medium',
  testID,
}: ToggleSwitchProps) {
  const handlePress = () => {
    if (!disabled) {
      onCheckedChange(!checked)
    }
  }

  // Calculate thumb position based on size and checked state
  const getThumbPosition = () => {
    const sizeMap = {
      small: { width: 32, thumbWidth: 12, offset: 3 },
      medium: { width: 44, thumbWidth: 18, offset: 3 },
      large: { width: 56, thumbWidth: 24, offset: 3 },
    }

    const { width, thumbWidth, offset } = sizeMap[size]
    const endOffsetCompensation = 1
    return checked ? width - thumbWidth - offset - endOffsetCompensation : offset
  }

  const thumbPosition = getThumbPosition()

  return (
    <View
      {...toggleSizeStyles[size]}
      backgroundColor={disabled ? '$color4' : checked ? '$blue7' : '$color5'}
      borderWidth={1}
      borderColor={disabled ? '$color4' : checked ? '$blue7' : '$color6'}
      position="relative"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      animation="quick"
      opacity={disabled ? 0.5 : 1}
      onPress={handlePress}
      testID={testID}
      focusStyle={{
        borderColor: '$blue7',
        outlineColor: '$blue7',
        outlineWidth: 2,
        outlineStyle: 'solid',
      }}
      hoverStyle={
        !disabled
          ? {
              borderColor: '$blue8',
            }
          : undefined
      }
    >
      <View
        {...thumbSizeStyles[size]}
        backgroundColor="white"
        position="absolute"
        left={thumbPosition}
        animation="200ms"
      />
    </View>
  )
}
