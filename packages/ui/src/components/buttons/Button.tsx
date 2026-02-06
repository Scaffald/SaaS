import React, { type ForwardRefExoticComponent, forwardRef, type RefAttributes } from 'react'
// Import Button directly from tamagui to preserve static properties (Text, Icon)
// The re-export through @unicornlove/ui doesn't preserve static properties
import { Button as TamaguiButton, type ButtonProps as TamaguiButtonProps } from 'tamagui'

/**
 * Button - Professional button component with Scaffald design system
 *
 * Five-variant button system featuring the teal brand color for primary actions.
 * All variants include proper hover, press, and disabled states with smooth animations.
 *
 * Variants:
 * - primary: Teal background (brand color), white text - for main actions
 * - secondary: Grey background, dark text - for secondary actions
 * - outlined: Transparent with border - for tertiary actions
 * - ghost: No border or background - for subtle actions
 * - danger: Red background, white text - for destructive actions
 *
 * Design Tokens Used:
 * - Colors: $blue7, $blue8, $blue9 (primary), $red8, $red9, $red10 (danger)
 * - Animations: quick (150ms)
 * - Font weight: 600 (semibold)
 *
 * States (all variants):
 * - Default: Base styling
 * - Hover: Darker/lighter background, enhanced contrast
 * - Press: Even darker background, slight scale reduction
 * - Disabled: Reduced opacity, no interactions
 *
 * @example
 * ```tsx
 * // Primary action button (teal)
 * <Button variant="primary" onPress={handleSubmit}>
 *   Submit Application
 * </Button>
 *
 * // Secondary action
 * <Button variant="secondary" onPress={handleCancel}>
 *   Cancel
 * </Button>
 *
 * // Outlined button
 * <Button variant="outlined" icon={<Plus />}>
 *   Add Item
 * </Button>
 *
 * // Ghost button for subtle actions
 * <Button variant="ghost" size="$3">
 *   Learn More
 * </Button>
 *
 * // Dangerous action (red)
 * <Button variant="danger" onPress={handleDelete}>
 *   Delete Account
 * </Button>
 * ```
 */

type ButtonTone = 'blue' | 'gray' | 'info' | 'success' | 'error' | 'accent'

export interface ButtonProps
  extends Omit<TamaguiButtonProps, 'variant' | 'theme' | 'fullWidth' | 'fullwidth' | 'icon'> {
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outlined' | 'ghost' | 'danger'
  /**
   * Optional tone overrides for brand-aligned styling
   */
  theme?: ButtonTone
  /**
   * Make button full width
   */
  fullWidth?: boolean
  /**
   * Icon to display on the left side of the button
   * Can be a React component (e.g., Lucide icon)
   */
  leftIcon?: React.ComponentType<{ size?: number; color?: string }>
  /**
   * Icon to display on the right side of the button
   * Can be a React component (e.g., Lucide icon)
   */
  rightIcon?: React.ComponentType<{ size?: number; color?: string }>
  /**
   * Tamagui icon prop (use leftIcon/rightIcon instead)
   */
  icon?: TamaguiButtonProps['icon']
}

const ButtonBase = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      theme,
      fullWidth,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      icon,
      ...restProps
    },
    ref
  ) => {
    // Extract fullWidth to prevent it from being passed to DOM
    // Convert fullWidth to width prop for Tamagui
    const widthProp = fullWidth ? { width: '100%' } : {}

    // Explicitly filter out fullWidth, fullwidth, leftIcon, rightIcon from restProps
    // This prevents React warnings about unknown DOM props
    // Use Object.keys to avoid inherited properties and ensure proper filtering
    const {
      fullWidth: _fullWidth,
      fullwidth: _fullwidth,
      leftIcon: _leftIcon,
      rightIcon: _rightIcon,
      ...cleanProps
    } = restProps as {
      fullWidth?: unknown
      fullwidth?: unknown
      leftIcon?: unknown
      rightIcon?: unknown
      [key: string]: unknown
    }

    // Handle icon prop - leftIcon takes precedence for backwards compatibility
    const iconElement = LeftIcon ? <LeftIcon size={16} /> : icon

    /**
     * Variant style definitions
     * Each variant has specific colors, borders, and interaction states
     */
    const variantStyles: Record<
      NonNullable<ButtonProps['variant']>,
      Partial<TamaguiButtonProps>
    > = {
      /**
       * Primary variant - Teal brand color
       * Use for main actions (submit, confirm, save)
       */
      primary: {
        background: '$blue7',
        color: '$color1',
        borderWidth: 0,
        hoverStyle: {
          background: '$blue8',
        },
        pressStyle: {
          background: '$blue9',
          scale: 0.97,
        },
      },

      /**
       * Secondary variant - Neutral grey
       * Use for secondary actions (back, skip)
       */
      secondary: {
        background: '$color3',
        color: '$color11',
        borderWidth: 0,
        hoverStyle: {
          background: '$color4',
        },
        pressStyle: {
          background: '$color5',
          scale: 0.97,
        },
      },

      /**
       * Outlined variant - Border only
       * Use for tertiary actions (cancel, optional)
       */
      outlined: {
        background: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor',
        color: '$color11',
        hoverStyle: {
          background: '$backgroundHover',
          borderColor: '$borderColorHover',
        },
        pressStyle: {
          background: '$backgroundPress',
          scale: 0.97,
        },
      },

      /**
       * Ghost variant - No visual boundaries
       * Use for subtle actions (show more, collapse)
       */
      ghost: {
        background: 'transparent',
        borderWidth: 0,
        color: '$color11',
        hoverStyle: {
          background: '$backgroundHover',
        },
        pressStyle: {
          background: '$backgroundPress',
          scale: 0.97,
        },
      },

      /**
       * Danger variant - Red for destructive actions
       * Use for irreversible actions (delete, remove)
       */
      danger: {
        background: '$red8',
        color: '$color1',
        borderWidth: 0,
        hoverStyle: {
          background: '$red9',
        },
        pressStyle: {
          background: '$red10',
          scale: 0.97,
        },
      },
    }

    const toneStyles: Record<ButtonTone, Partial<TamaguiButtonProps>> = {
      blue: {
        background: '$blue7',
        color: '$color1',
        borderWidth: 0,
        hoverStyle: { background: '$blue8' },
        pressStyle: { background: '$blue9', scale: 0.97 },
      },
      gray: {
        background: '$color3',
        color: '$color11',
        borderWidth: 0,
        hoverStyle: { background: '$color4' },
        pressStyle: { background: '$color5', scale: 0.97 },
      },
      info: {
        background: '$blue6',
        color: '$color1',
        borderWidth: 0,
        hoverStyle: { background: '$blue7' },
        pressStyle: { background: '$blue8', scale: 0.97 },
      },
      success: {
        background: '$green8',
        color: '$color1',
        borderWidth: 0,
        hoverStyle: { background: '$green9' },
        pressStyle: { background: '$green10', scale: 0.97 },
      },
      error: {
        background: '$red8',
        color: '$color1',
        borderWidth: 0,
        hoverStyle: { background: '$red9' },
        pressStyle: { background: '$red10', scale: 0.97 },
      },
      accent: {
        background: '$purple8',
        color: '$color1',
        borderWidth: 0,
        hoverStyle: { background: '$purple9' },
        pressStyle: { background: '$purple10', scale: 0.97 },
      },
    }

    const toneStyle = theme ? toneStyles[theme] : undefined

    // Handle rightIcon as iconAfter
    const iconAfterElement = RightIcon ? <RightIcon size={16} /> : undefined

    return (
      <TamaguiButton
        ref={ref}
        fontWeight="600" // Semibold for all buttons
        animation="quick" // Fast, responsive animations
        icon={iconElement}
        iconAfter={iconAfterElement}
        {...variantStyles[variant]}
        {...toneStyle}
        {...(widthProp as any)}
        {...cleanProps}
      />
    )
  }
)

ButtonBase.displayName = 'Button'

type ButtonComponent = ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLButtonElement>> & {
  Text: typeof TamaguiButton.Text
  Icon: typeof TamaguiButton.Icon
}

export const Button: ButtonComponent = Object.assign(ButtonBase, {
  Text: TamaguiButton.Text,
  Icon: TamaguiButton.Icon,
})
