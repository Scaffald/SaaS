import { styled, View } from 'tamagui'

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

const RadioContainer = styled(View, {
  position: 'relative',
  cursor: 'pointer',
  animation: 'quick',
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
        borderColor: '$blue7',
      },
      false: {
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

const RadioDot = styled(View, {
  position: 'absolute',
  backgroundColor: '$blue7',
  borderRadius: 50,
  variants: {
    size: {
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
    <RadioContainer
      checked={checked}
      disabled={disabled}
      size={size}
      onPress={handlePress}
      testID={testID}
      borderWidth={2}
      borderRadius={50}
      backgroundColor="transparent"
    >
      <RadioDot checked={checked} size={size} />
    </RadioContainer>
  )
}
