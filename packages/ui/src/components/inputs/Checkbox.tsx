import { Check } from '@tamagui/lucide-icons'
import { View } from '@tamagui/core'
import { Platform } from 'react-native'

export interface CheckboxProps {
  /** Whether the checkbox is checked */
  checked: boolean
  /** Callback when checked state changes */
  onCheckedChange: (checked: boolean) => void
  /** Whether the checkbox is disabled */
  disabled?: boolean
  /** Size of the checkbox */
  size?: 'small' | 'medium' | 'large'
  /** Optional test ID for testing */
  testID?: string
  /** Optional aria-label attribute for web */
  ariaLabel?: string
  /** Optional aria-labelledby attribute for web */
  ariaLabelledBy?: string
  /** Optional aria-describedby attribute for web */
  ariaDescribedBy?: string
}

// Size styles for the checkbox container
const sizeStyles: Record<
  NonNullable<CheckboxProps['size']>,
  { width: string; height: string; br: string }
> = {
  small: {
    width: '$1',
    height: '$1',
    br: '$1',
  },
  medium: {
    width: '$1',
    height: '$1',
    br: '$2',
  },
  large: {
    width: '$2',
    height: '$2',
    br: '$2',
  },
}

// Checked state styles
const checkedStyles: Record<string, { background: string; borderColor: string }> = {
  checked: {
    background: '$blue7',
    borderColor: '$blue7',
  },
  unchecked: {
    background: 'transparent',
    borderColor: '$borderColor',
  },
}

/**
 * Checkbox - A custom animated checkbox component
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
 * <Checkbox
 *   checked={isChecked}
 *   onCheckedChange={setIsChecked}
 *   size="medium"
 *   disabled={false}
 * />
 * ```
 */
export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  size = 'medium',
  testID,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
}: CheckboxProps) {
  const handlePress = () => {
    if (!disabled) {
      onCheckedChange(!checked)
    }
  }

  const accessibilityProps =
    Platform.OS === 'web'
      ? {
          role: 'checkbox' as const,
          'aria-checked': checked,
          ...(disabled ? { 'aria-disabled': true } : {}),
          ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
          ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
          ...(ariaDescribedBy ? { 'aria-describedby': ariaDescribedBy } : {}),
          ...(testID ? { 'data-testid': testID } : {}),
        }
      : {
          accessibilityRole: 'checkbox' as const,
          accessibilityState: { checked, disabled },
          ...(ariaLabel ? { accessibilityLabel: ariaLabel } : {}),
          ...(ariaLabelledBy ? { accessibilityLabelledBy: [ariaLabelledBy] } : {}),
          ...(testID ? { testID } : {}),
        }

  return (
    <View
      {...sizeStyles[size]}
      {...checkedStyles[checked ? 'checked' : 'unchecked']}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      animation="quick"
      overflow="hidden"
      borderWidth={1}
      opacity={disabled ? 0.5 : 1}
      onPress={handlePress}
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
      style={{ alignItems: 'center', justifyContent: 'center' }}
      {...accessibilityProps}
    >
      <View
        pointerEvents="none"
        width="100%"
        height="100%"
        opacity={checked ? 1 : 0}
        style={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <Check size={size === 'small' ? 12 : size === 'medium' ? 12 : 12} color="white" />
      </View>
    </View>
  )
}
