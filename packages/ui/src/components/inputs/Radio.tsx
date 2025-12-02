import { View, type ViewProps } from 'tamagui'

export interface RadioProps {
  /** Whether the radio is selected */
  checked: boolean
  /** Callback when checked state changes */
  onCheckedChange: (checked: boolean) => void
  /** Whether the radio is disabled */
  disabled?: boolean
  /** Size of the radio button */
  size?: 'small' | 'medium' | 'large'
  /** Optional test ID for testing */
  testID?: string
}

// Size styles for the radio container
const containerSizeStyles: Record<NonNullable<RadioProps['size']>, Partial<ViewProps>> = {
  small: {
    width: 16,
    height: 16,
  },
  medium: {
    width: 20,
    height: 20,
  },
  large: {
    width: 24,
    height: 24,
  },
}

// Size styles for the radio dot
const dotSizeStyles: Record<NonNullable<RadioProps['size']>, Partial<ViewProps>> = {
  small: {
    width: 8,
    height: 8,
    top: 2,
    left: 2,
  },
  medium: {
    width: 10,
    height: 10,
    top: 3,
    left: 3,
  },
  large: {
    width: 12,
    height: 12,
    top: 4,
    left: 4,
  },
}

/**
 * Radio - A custom animated radio button component
 *
 * Features:
 * - Smooth animations for state changes
 * - Multiple sizes (small, medium, large)
 * - Disabled state support
 * - Cross-platform compatible
 * - Consistent styling with other form controls
 *
 * @example
 * ```tsx
 * <Radio
 *   checked={isSelected}
 *   onCheckedChange={setIsSelected}
 *   size="medium"
 *   disabled={false}
 * />
 * ```
 */
export function Radio({
  checked,
  onCheckedChange,
  disabled = false,
  size = 'medium',
  testID,
}: RadioProps) {
  const handlePress = () => {
    if (!disabled) {
      onCheckedChange(!checked)
    }
  }

  return (
    <View
      {...containerSizeStyles[size]}
      position="relative"
      cursor={disabled ? 'not-allowed' : 'pointer'}
      animation="quick"
      borderWidth={2}
      borderRadius={50}
      backgroundColor="transparent"
      borderColor={checked ? '$blue7' : '$borderColor'}
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
              scale: 1.05,
              borderColor: '$blue8',
            }
          : undefined
      }
      pressStyle={
        !disabled
          ? {
              scale: 0.95,
            }
          : undefined
      }
    >
      <View
        {...dotSizeStyles[size]}
        position="absolute"
        backgroundColor="$blue7"
        borderRadius={50}
        opacity={checked ? 1 : 0}
      />
    </View>
  )
}
