import { forwardRef, type ReactElement } from 'react'
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

export interface ButtonProps extends Omit<TamaguiButtonProps, 'variant' | 'theme'> {
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outlined' | 'ghost' | 'danger'
}

const ButtonBase = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', ...props }, ref) => {
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
        theme: 'primary',
        backgroundColor: '$blue7',
        color: '$color1',
        borderWidth: 0,
        hoverStyle: {
          backgroundColor: '$blue8',
        },
        pressStyle: {
          backgroundColor: '$blue9',
          scale: 0.97,
        },
      },

      /**
       * Secondary variant - Neutral grey
       * Use for secondary actions (back, skip)
       */
      secondary: {
        theme: 'alt1',
        backgroundColor: '$color3',
        color: '$color11',
        borderWidth: 0,
        hoverStyle: {
          backgroundColor: '$color4',
        },
        pressStyle: {
          backgroundColor: '$color5',
          scale: 0.97,
        },
      },

      /**
       * Outlined variant - Border only
       * Use for tertiary actions (cancel, optional)
       */
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor',
        color: '$color11',
        hoverStyle: {
          backgroundColor: '$backgroundHover',
          borderColor: '$borderColorHover',
        },
        pressStyle: {
          backgroundColor: '$backgroundPress',
          scale: 0.97,
        },
      },

      /**
       * Ghost variant - No visual boundaries
       * Use for subtle actions (show more, collapse)
       */
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        color: '$color11',
        hoverStyle: {
          backgroundColor: '$backgroundHover',
        },
        pressStyle: {
          backgroundColor: '$backgroundPress',
          scale: 0.97,
        },
      },

      /**
       * Danger variant - Red for destructive actions
       * Use for irreversible actions (delete, remove)
       */
      danger: {
        theme: 'red',
        backgroundColor: '$red8',
        color: '$color1',
        borderWidth: 0,
        hoverStyle: {
          backgroundColor: '$red9',
        },
        pressStyle: {
          backgroundColor: '$red10',
          scale: 0.97,
        },
      },
    }

    return (
      <TamaguiButton
        ref={ref}
        fontWeight="600" // Semibold for all buttons
        animation="quick" // Fast, responsive animations
        {...variantStyles[variant]}
        {...props}
      />
    )
  }
)

ButtonBase.displayName = 'UIButton'

type UIButtonComponent = ((props: ButtonProps) => ReactElement) & {
  Text: typeof TamaguiButton.Text
  Icon: typeof TamaguiButton.Icon
}

export const Button: UIButtonComponent = Object.assign(ButtonBase, {
  Text: TamaguiButton.Text,
  Icon: TamaguiButton.Icon,
})
