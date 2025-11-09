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
  cursor: 'pointer',
  animation: 'quick',
  overflow: 'hidden',
  items: 'center',
  justify: 'center',
  borderWidth: 2,
  variants: {
    size: {
      small: {
        width: '$3',
        height: '$3',
        borderRadius: '$1',
      },
      medium: {
        width: '$4',
        height: '$4',
        borderRadius: '$2',
      },
      large: {
        width: '$5',
        height: '$5',
        borderRadius: '$3',
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
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <CheckboxIcon checked={checked}>
        <Check size={size === 'small' ? 10 : size === 'medium' ? 12 : 14} color="white" />
      </CheckboxIcon>
    </CheckboxContainer>
  )
}
