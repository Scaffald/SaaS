/**
 * SocialButton component
 * Pre-configured buttons for social media authentication
 *
 * @example
 * ```tsx
 * import { SocialButton } from '@scaffald/ui'
 *
 * // Apple sign in
 * <SocialButton brand="apple" onPress={handleAppleSignIn} />
 *
 * // Google sign in with custom text
 * <SocialButton brand="google" text="Sign in with Google" />
 *
 * // Icon-only Facebook button
 * <SocialButton brand="facebook" iconOnly />
 * ```
 */

import { Button } from '../Button'
import type { ButtonColor, ButtonVariant } from '../Button'
import type { SocialButtonProps, SocialBrand, BrandConfig } from './SocialButton.types'

/**
 * Brand configurations
 * Icons should be provided by the consumer as we don't include brand assets
 */
const brandConfigs: Record<SocialBrand, BrandConfig> = {
  apple: {
    name: 'Apple',
    defaultText: 'Continue with Apple',
  },
  google: {
    name: 'Google',
    defaultText: 'Continue with Google',
  },
  microsoft: {
    name: 'Microsoft',
    defaultText: 'Continue with Microsoft',
  },
  facebook: {
    name: 'Facebook',
    defaultText: 'Continue with Facebook',
  },
  x: {
    name: 'X',
    defaultText: 'Continue with X',
  },
  dribbble: {
    name: 'Dribbble',
    defaultText: 'Continue with Dribbble',
  },
  figma: {
    name: 'Figma',
    defaultText: 'Continue with Figma',
  },
}

export function SocialButton({
  brand,
  buttonStyle = 'outline',
  text,
  icon,
  iconOnly = false,
  ...buttonProps
}: SocialButtonProps) {
  const config = brandConfigs[brand]
  const displayText = text || config.defaultText

  // Map social button style to base Button variant
  const getButtonVariant = (): ButtonVariant => {
    if (buttonStyle === 'filled') return 'filled'
    if (buttonStyle === 'outlineGray') return 'outline'
    return 'outline'
  }

  // Map social button style to base Button color
  const getButtonColor = (): ButtonColor => {
    if (buttonStyle === 'filled') {
      // Filled style uses brand-specific colors
      // For now, use gray as default - consumers can customize via style prop
      return 'gray'
    }
    return 'gray'
  }

  return (
    <Button
      {...buttonProps}
      variant={getButtonVariant()}
      color={getButtonColor()}
      iconStart={icon}
      iconOnly={iconOnly}
    >
      {!iconOnly && displayText}
    </Button>
  )
}

// Export types
export type { SocialButtonProps, SocialBrand, SocialButtonStyle } from './SocialButton.types'
