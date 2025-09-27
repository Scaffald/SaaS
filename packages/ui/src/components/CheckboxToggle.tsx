import type { ColorTokens, FontSizeTokens, SizeTokens } from '@tamagui/core'
import { getSize } from '@tamagui/get-token'
import { Check, X } from '@tamagui/lucide-icons'
import { forwardRef } from 'react'
import type { CheckedState, CheckboxProps, SwitchProps } from 'tamagui'
import {
  Checkbox as TCheckbox,
  Switch as TSwitch,
  createSwitch,
  View,
  getVariableValue,
  styled,
  getFontSize,
  useTheme,
  getVariable,
  useGetThemedIcon,
  withStaticProperties,
  SwitchStyledContext,
  Label,
  XStack,
  YStack,
  Text,
  AnimatePresence,
  Theme,
  isWeb,
} from 'tamagui'

/**
 * Enhanced CheckboxToggle Component
 *
 * A unified component that can render as either a checkbox or toggle/switch
 * with bento-inspired patterns including:
 * - Multiple visual variants (checkbox, toggle, card, minimal)
 * - Enhanced animations and focus states
 * - Custom icons and theming
 * - Keyboard navigation support
 * - Cross-platform compatibility
 */

// Types
export type CheckboxToggleVariant = 'checkbox' | 'toggle' | 'card' | 'minimal'
export type CheckboxToggleSize = SizeTokens
export type CheckboxToggleAnimationPreset = 'quick' | 'medium' | 'slow' | 'bouncy' | '100ms'

export interface CheckboxToggleProps {
  /** The visual variant to render */
  variant?: CheckboxToggleVariant
  /** Size of the component */
  size?: CheckboxToggleSize
  /** Whether the component is checked */
  checked?: CheckedState
  /** Callback when checked state changes */
  onCheckedChange?: (checked: CheckedState) => void
  /** Whether the component is disabled */
  disabled?: boolean
  /** Label text */
  label?: string
  /** Description text (for card variant) */
  description?: string
  /** Custom icon for checked state */
  checkedIcon?: React.ReactNode
  /** Custom icon for unchecked state */
  uncheckedIcon?: React.ReactNode
  /** Animation preset */
  animationPreset?: CheckboxToggleAnimationPreset
  /** Whether to show focus ring */
  showFocusRing?: boolean
  /** Error state */
  error?: boolean
  /** Required indicator */
  required?: boolean
  /** Optional indicator */
  optional?: boolean
  /** ID for accessibility */
  id?: string
  /** Additional props */
  [key: string]: any
}

// Animation configurations
const animationPresets = {
  quick: '100ms',
  medium: '200ms',
  slow: '300ms',
  bouncy: 'bouncy',
  '100ms': '100ms',
} as const

// Enhanced Switch Components (for toggle variant)
const SwitchThumb = styled(View, {
  name: 'CheckboxToggleSwitchThumb',
  animation: 'quick',

  variants: {
    unstyled: {
      false: {
        size: '$true',
        backgroundColor: '$background',
        borderRadius: 1000,
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        shadowOpacity: 0.15,
      },
    },

    checked: {
      true: {
        backgroundColor: '$background',
      },
    },

    size: {
      '...size': (val) => {
        const size = getSwitchHeight(val)
        return {
          height: size,
          width: size,
        }
      },
    },

    animationPreset: {
      quick: { animation: 'quick' },
      medium: { animation: 'medium' },
      slow: { animation: 'slow' },
      bouncy: { animation: 'bouncy' },
      '100ms': { animation: '100ms' },
    },
  } as const,

  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === '1' ? true : false,
  },
})

const getSwitchHeight = (val: SizeTokens) => {
  const baseSize = Math.round(getVariableValue(getSize(val)) * 0.3) // Scale down significantly
  return Math.min(Math.max(baseSize, 16), 28) // Min 16px, max 28px
}
const getSwitchWidth = (val: SizeTokens) => getSwitchHeight(val) * 2

const SwitchFrame = styled(View, {
  name: 'CheckboxToggleSwitchFrame',
  tag: 'button',

  variants: {
    unstyled: {
      false: {
        borderRadius: 1000,
        backgroundColor: '$color3',
        borderWidth: 2,
        borderColor: '$color5',
        cursor: 'pointer',

        focusStyle: {
          outlineColor: '$outlineColor',
          outlineStyle: 'solid',
          outlineWidth: 2,
        },

        hoverStyle: {
          backgroundColor: '$color4',
          borderColor: '$color6',
        },

        pressStyle: {
          backgroundColor: '$color5',
        },
      },
    },

    checked: {
      true: {
        backgroundColor: '$color9',
        borderColor: '$color9',
      },
      false: {
        backgroundColor: '$color3',
        borderColor: '$color5',
      },
    },

    size: {
      '...size': (val) => {
        const height = getSwitchHeight(val) + 4
        const width = getSwitchWidth(val) + 4
        return {
          height,
          minHeight: height,
          width,
        }
      },
    },

    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
        hoverStyle: {},
        pressStyle: {},
      },
    },

    error: {
      true: {
        borderColor: '$red8',
        backgroundColor: '$red3',
      },
    },

    animationPreset: {
      quick: { animation: 'quick' },
      medium: { animation: 'medium' },
      slow: { animation: 'slow' },
      bouncy: { animation: 'bouncy' },
      '100ms': { animation: '100ms' },
    },
  } as const,

  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === '1' ? true : false,
  },
})

const SwitchIconFrame = styled(View, {
  position: 'absolute',
  context: SwitchStyledContext,
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  variants: {
    placement: {
      right: (_, { props, tokens }) => {
        const amount = tokens.space[(props as any).size as any].val * 0.35
        return {
          right: amount,
        }
      },
      left: (_, { props, tokens }) => {
        const amount = tokens.space[(props as any).size as any].val * 0.35
        return {
          left: amount,
        }
      },
    },
    size: {
      '...size': {} as any,
    },
  } as const,
  defaultVariants: {
    placement: 'right',
  },
})

const getIconSize = (size: FontSizeTokens, scale: number) => {
  return (typeof size === 'number' ? size * 0.5 : getFontSize(size as FontSizeTokens)) * scale
}

const SwitchIcon = SwitchIconFrame.styleable<{
  scaleIcon?: number
  color?: ColorTokens | string
}>((props, ref) => {
  const { children, color: colorProp, scaleIcon = 1.2, ...rest } = props
  const { size } = SwitchStyledContext.useStyledContext()

  const theme = useTheme()
  const color = getVariable(
    colorProp || theme[colorProp as any]?.get('web') || theme.color10?.get('web')
  )
  const iconSize = getIconSize(size as FontSizeTokens, scaleIcon)

  const getThemedIcon = useGetThemedIcon({ size: iconSize, color: color as any })
  return (
    <SwitchIconFrame ref={ref} {...rest}>
      {getThemedIcon(children)}
    </SwitchIconFrame>
  )
})

const EnhancedSwitch = createSwitch({
  Frame: SwitchFrame,
  Thumb: SwitchThumb,
})

// Enhanced Checkbox Components
const CheckboxFrame = styled(TCheckbox, {
  name: 'CheckboxToggleCheckboxFrame',

  variants: {
    size: {
      '...size': (val, { tokens }) => {
        // Use much smaller, more reasonable fixed sizes for checkboxes
        const sizeMap = {
          $2: 12,
          $3: 14,
          $4: 16,
          $5: 18,
          $6: 20,
        }
        const size = sizeMap[val as keyof typeof sizeMap] || 20
        return {
          width: size,
          height: size,
        }
      },
    },

    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },

    error: {
      true: {
        borderColor: '$red8',
        backgroundColor: '$red3',
      },
    },

    animationPreset: {
      quick: { animation: 'quick' },
      medium: { animation: 'medium' },
      slow: { animation: 'slow' },
      bouncy: { animation: 'bouncy' },
      '100ms': { animation: '100ms' },
    },
  } as const,
})

// Card variant components
const CardFrame = styled(View, {
  name: 'CheckboxToggleCard',
  cursor: 'pointer',
  borderRadius: '$4',
  padding: '$4',
  backgroundColor: '$color2',
  borderColor: '$color6',
  borderWidth: 1,
  minHeight: 80,

  focusStyle: {
    backgroundColor: '$color3',
    borderColor: '$color8',
    outlineColor: '$outlineColor',
    outlineStyle: 'solid',
    outlineWidth: 2,
  },

  hoverStyle: {
    backgroundColor: '$color3',
    borderColor: '$color7',
  },

  pressStyle: {
    backgroundColor: '$color4',
    borderColor: '$color8',
  },

  variants: {
    checked: {
      true: {
        backgroundColor: '$color4',
        borderColor: '$color9',
        borderWidth: 2,
      },
    },

    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
        hoverStyle: {},
        pressStyle: {},
      },
    },

    error: {
      true: {
        borderColor: '$red8',
        backgroundColor: '$red3',
      },
    },

    size: {
      small: { padding: '$3', minHeight: 60 },
      medium: { padding: '$4', minHeight: 80 },
      large: { padding: '$5', minHeight: 100 },
    },

    animationPreset: {
      quick: { animation: 'quick' },
      medium: { animation: 'medium' },
      slow: { animation: 'slow' },
      bouncy: { animation: 'bouncy' },
      '100ms': { animation: '100ms' },
    },
  } as const,
})

// Minimal variant components
const MinimalFrame = styled(View, {
  name: 'CheckboxToggleMinimal',
  cursor: 'pointer',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$2',
  padding: '$2',
  borderRadius: '$2',

  focusStyle: {
    backgroundColor: '$color3',
    outlineColor: '$outlineColor',
    outlineStyle: 'solid',
    outlineWidth: 1,
  },

  hoverStyle: {
    backgroundColor: '$color2',
  },

  pressStyle: {
    backgroundColor: '$color3',
  },

  variants: {
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
        hoverStyle: {},
        pressStyle: {},
      },
    },

    animationPreset: {
      quick: { animation: 'quick' },
      medium: { animation: 'medium' },
      slow: { animation: 'slow' },
      bouncy: { animation: 'bouncy' },
      '100ms': { animation: '100ms' },
    },
  } as const,
})

// Main component implementation
export const CheckboxToggle = forwardRef<any, CheckboxToggleProps>((props, ref) => {
  const {
    variant = 'checkbox',
    size = '$4',
    checked = false,
    onCheckedChange,
    disabled = false,
    label,
    description,
    checkedIcon,
    uncheckedIcon,
    animationPreset = 'quick',
    showFocusRing = true,
    error = false,
    required = false,
    optional = false,
    id,
    ...rest
  } = props

  const animation = animationPresets[animationPreset]

  // Common label component
  const LabelComponent = label ? (
    <Label
      htmlFor={id}
      size={size}
      color={error ? '$red11' : '$color11'}
      fontWeight={required ? '600' : '500'}
      cursor={disabled ? 'not-allowed' : 'pointer'}
    >
      {label}
      {required && <Text color="$red9"> *</Text>}
      {optional && <Text color="$gray9"> (optional)</Text>}
    </Label>
  ) : null

  // Checkbox variant
  if (variant === 'checkbox') {
    return (
      <Theme name={error ? 'red' : null}>
        <XStack gap="$3" alignItems="center" opacity={disabled ? 0.5 : 1} {...rest}>
          <CheckboxFrame
            ref={ref}
            id={id}
            size={size}
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            error={error}
            animationPreset={animationPreset}
            animation={animation}
            native={!isWeb}
            focusStyle={
              showFocusRing
                ? {
                    outlineColor: '$outlineColor',
                    outlineStyle: 'solid',
                    outlineWidth: 2,
                  }
                : {}
            }
          >
            <TCheckbox.Indicator animation={animation}>
              {checkedIcon || <Check size={16} />}
            </TCheckbox.Indicator>
          </CheckboxFrame>
          {LabelComponent}
        </XStack>
      </Theme>
    )
  }

  // Toggle/Switch variant
  if (variant === 'toggle') {
    // Map our size tokens to much smaller switch sizes
    const switchSize = size === '$2' ? '$1' : size === '$6' ? '$3' : '$2'

    // If we have custom icons, use our enhanced switch, otherwise use basic Tamagui switch
    if (checkedIcon || uncheckedIcon) {
      return (
        <Theme name={error ? 'red' : null}>
          <XStack gap="$3" alignItems="center" opacity={disabled ? 0.5 : 1} {...rest}>
            {LabelComponent}
            <EnhancedSwitch
              ref={ref}
              id={id}
              size={switchSize}
              checked={checked}
              onCheckedChange={onCheckedChange}
              disabled={disabled}
              error={error}
              animationPreset={animationPreset}
              native={!isWeb}
            >
              {uncheckedIcon && <SwitchIcon placement="left">{uncheckedIcon}</SwitchIcon>}
              {checkedIcon && <SwitchIcon placement="right">{checkedIcon}</SwitchIcon>}
              <SwitchThumb animation={animation} animationPreset={animationPreset} />
            </EnhancedSwitch>
          </XStack>
        </Theme>
      )
    }

    // Basic switch without icons
    return (
      <Theme name={error ? 'red' : null}>
        <XStack gap="$3" alignItems="center" opacity={disabled ? 0.5 : 1} {...rest}>
          {LabelComponent}
          <TSwitch
            ref={ref}
            id={id}
            size={switchSize}
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            native={!isWeb}
            backgroundColor={error ? '$red8' : undefined}
          >
            <TSwitch.Thumb animation={animation} />
          </TSwitch>
        </XStack>
      </Theme>
    )
  }

  // Card variant
  if (variant === 'card') {
    return (
      <Theme name={error ? 'red' : null}>
        <CardFrame
          ref={ref}
          checked={checked}
          disabled={disabled}
          error={error}
          size={size === '$2' ? 'small' : size === '$6' ? 'large' : 'medium'}
          animationPreset={animationPreset}
          animation={animation}
          onPress={disabled ? undefined : () => onCheckedChange?.(!checked)}
          {...rest}
        >
          <XStack gap="$3" alignItems="flex-start" flex={1}>
            <CheckboxFrame
              id={id}
              size={size}
              checked={checked}
              onCheckedChange={onCheckedChange}
              disabled={disabled}
              error={error}
              animationPreset={animationPreset}
              animation={animation}
              native={!isWeb}
              pointerEvents="none" // Let the card handle the interaction
            >
              <TCheckbox.Indicator animation={animation}>
                {checkedIcon || <Check size={16} />}
              </TCheckbox.Indicator>
            </CheckboxFrame>
            <YStack flex={1} gap="$1">
              {LabelComponent}
              {description && (
                <Text size="$3" color={error ? '$red10' : '$color10'} opacity={disabled ? 0.7 : 1}>
                  {description}
                </Text>
              )}
            </YStack>
          </XStack>
        </CardFrame>
      </Theme>
    )
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <Theme name={error ? 'red' : null}>
        <MinimalFrame
          ref={ref}
          disabled={disabled}
          animationPreset={animationPreset}
          animation={animation}
          onPress={disabled ? undefined : () => onCheckedChange?.(!checked)}
          {...rest}
        >
          <View
            width={size === '$2' ? 10 : size === '$6' ? 14 : 12}
            height={size === '$2' ? 10 : size === '$6' ? 14 : 12}
            borderRadius="$2"
            borderWidth={2}
            borderColor={checked ? '$color9' : '$color6'}
            backgroundColor={checked ? '$color9' : 'transparent'}
            justifyContent="center"
            alignItems="center"
          >
            <AnimatePresence>
              {checked && (
                <View
                  key="check"
                  animation={animation}
                  enterStyle={{ opacity: 0, scale: 0.5 }}
                  exitStyle={{ opacity: 0, scale: 0.5 }}
                  opacity={1}
                  scale={1}
                >
                  {checkedIcon || (
                    <Check size={size === '$2' ? 8 : size === '$6' ? 10 : 9} color="$background" />
                  )}
                </View>
              )}
            </AnimatePresence>
          </View>
          {LabelComponent}
        </MinimalFrame>
      </Theme>
    )
  }

  // Fallback to checkbox
  return <CheckboxToggle {...props} variant="checkbox" ref={ref} />
})

CheckboxToggle.displayName = 'CheckboxToggle'

// Enhanced component with static properties
export const EnhancedCheckboxToggle = withStaticProperties(CheckboxToggle, {
  Icon: SwitchIcon,
  Switch: EnhancedSwitch,
  Checkbox: CheckboxFrame,
})

export default EnhancedCheckboxToggle
