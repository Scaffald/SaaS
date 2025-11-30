import { Check } from '@tamagui/lucide-icons'
import { Platform } from 'react-native'
import { styled, View } from 'tamagui'

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

const CheckboxContainer = styled(View, {
  cursor: 'pointer',
  animation: 'quick',
  overflow: 'hidden',
  items: 'center',
  justify: 'center',
  borderWidth: 1,
  variants: {
    size: {
      small: {
        width: '$1',
        height: '$1',
        borderRadius: '$1',
      },
      medium: {
        width: '$1',
        height: '$1',
        borderRadius: '$2',
      },
      large: {
        width: '$2',
        height: '$2',
        borderRadius: '$2',
      },
    },
    checked: {
      true: {
        bg: '$blue7',
        borderColor: '$blue7',
      },
      false: {
        bg: 'transparent',
        borderColor: '$borderColor',
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
      false: {
        opacity: 1,
        cursor: 'pointer',
      },
    },
  } as const,
  focusStyle: {
    borderColor: '$blue7',
    outlineColor: '$blue7',
    outlineWidth: 2,
    outlineStyle: 'solid',
  },
  hoverStyle: {
    scale: 1.05,
    borderColor: '$blue8',
  },
  pressStyle: {
    scale: 0.95,
  },
})

const CheckboxIcon = styled(View, {
  pointerEvents: 'none',
  width: '100%',
  height: '100%',
  items: 'center',
  justify: 'center',
  variants: {
    checked: {
      true: {
        opacity: 1,
      },
      false: {
        opacity: 0,
      },
    },
  } as const,
})

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
    <CheckboxContainer
      checked={checked}
      disabled={disabled}
      size={size}
      onPress={handlePress}
      {...accessibilityProps}
    >
      <CheckboxIcon checked={checked}>
        <Check size={size === 'small' ? 12 : size === 'medium' ? 12 : 12} color="white" />
      </CheckboxIcon>
    </CheckboxContainer>
  )
}
