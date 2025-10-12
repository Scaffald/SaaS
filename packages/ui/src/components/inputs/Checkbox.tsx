import { styled, View } from 'tamagui'
import { Check } from '@tamagui/lucide-icons'

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
  /** Optional label for accessibility */
  accessibilityLabel?: string
}

const CheckboxContainer = styled(View, {
  position: 'relative',
  cursor: 'pointer',
  animation: '100ms',
  variants: {
    size: {
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
    },
    checked: {
      true: {
        bg: '$color10',
        borderColor: '$color10',
      },
      false: {
        bg: 'transparent',
        borderColor: '$color10',
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
  hoverStyle: {
    scale: 1.05,
  },
  pressStyle: {
    scale: 0.95,
  },
})

const CheckboxIcon = styled(View, {
  position: 'absolute',
  t: 0,
  l: 0,
  r: 0,
  b: 0,
  items: 'center',
  justify: 'center',
  variants: {
    size: {
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
    },
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
  accessibilityLabel,
}: CheckboxProps) {
  const handlePress = () => {
    if (!disabled) {
      onCheckedChange(!checked)
    }
  }

  return (
    <CheckboxContainer
      checked={checked}
      disabled={disabled}
      size={size}
      onPress={handlePress}
      aria-label={accessibilityLabel}
      testID={testID}
      borderWidth={2}
      rounded={size === 'small' ? 2 : size === 'medium' ? 3 : 4}
    >
      <CheckboxIcon checked={checked} size={size}>
        <Check size={size === 'small' ? 10 : size === 'medium' ? 12 : 14} color="white" />
      </CheckboxIcon>
    </CheckboxContainer>
  )
}
