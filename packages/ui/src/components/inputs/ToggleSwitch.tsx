import { styled, View } from 'tamagui'

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

const CustomToggle = styled(View, {
  width: 44,
  height: 24,
  rounded: 12,
  bg: '$color5',
  borderWidth: 1,
  borderColor: '$color6',
  position: 'relative',
  cursor: 'pointer',
  animation: 'quick',
  variants: {
    checked: {
      true: {
        bg: '$blue7',
        borderColor: '$blue7',
      },
      false: {
        bg: '$color5',
        borderColor: '$color6',
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
        bg: '$color4',
        borderColor: '$color4',
      },
      false: {
        opacity: 1,
        cursor: 'pointer',
      },
    },
    size: {
      small: {
        width: 32,
        height: 18,
        rounded: 9,
      },
      medium: {
        width: 44,
        height: 24,
        rounded: 12,
      },
      large: {
        width: 56,
        height: 30,
        rounded: 15,
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
    borderColor: '$blue8',
  },
})

const ToggleThumb = styled(View, {
  width: 18,
  height: 18,
  rounded: 9,
  bg: 'white',
  position: 'absolute',
  t: 2,
  l: 2,
  animation: '200ms',
  variants: {
    checked: {
      true: {
        l: 22,
      },
      false: {
        l: 2,
      },
    },
    size: {
      small: {
        width: 12,
        height: 12,
        rounded: 6,
        t: 2,
        l: 2,
      },
      medium: {
        width: 18,
        height: 18,
        rounded: 9,
        t: 2,
        l: 2,
      },
      large: {
        width: 24,
        height: 24,
        rounded: 12,
        t: 2,
        l: 2,
      },
    },
  } as const,
})

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

  return (
    <CustomToggle
      checked={checked}
      disabled={disabled}
      size={size}
      onPress={handlePress}
      testID={testID}
    >
      <ToggleThumb
        checked={checked}
        size={size}
        style={{
          left: getThumbPosition(),
        }}
      />
    </CustomToggle>
  )
}
