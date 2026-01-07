/**
 * SocialButton component types
 * Social media authentication buttons mapped from Figma
 */

import type { ButtonProps } from '../Button/Button.types'

/**
 * Social media brands
 */
export type SocialBrand = 'apple' | 'google' | 'microsoft' | 'facebook' | 'x' | 'dribbble' | 'figma'

/**
 * Social button style variants
 */
export type SocialButtonStyle = 'filled' | 'outline' | 'outlineGray'

/**
 * Social button props
 */
export interface SocialButtonProps
  extends Omit<ButtonProps, 'children' | 'color' | 'variant' | 'iconStart' | 'iconEnd'> {
  /**
   * Social media brand
   * @required
   */
  brand: SocialBrand

  /**
   * Button style variant
   * @default 'outline'
   */
  buttonStyle?: SocialButtonStyle

  /**
   * Custom text (overrides default "Continue with {Brand}")
   */
  text?: string

  /**
   * Custom icon component (overrides brand default)
   */
  icon?: React.ComponentType<{ size: number; color: string }>
}

/**
 * Brand configuration
 */
export interface BrandConfig {
  name: string
  defaultText: string
  icon?: React.ComponentType<{ size: number; color: string }>
}
