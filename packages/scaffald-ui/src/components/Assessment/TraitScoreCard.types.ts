import type { ViewStyle } from 'react-native'
import type { IconComponent } from '../types'

export interface TraitScoreCardProps {
  /**
   * Name of the trait being scored
   */
  trait: string

  /**
   * Score value (0-100)
   */
  score: number

  /**
   * Optional icon component to display
   * Expected signature: (props: { size: number; color: string }) => ReactNode
   */
  icon?: IconComponent

  /**
   * Accent color for the icon background tint and score bar
   * @default colors.primary[500]
   */
  color?: string

  /**
   * Animation delay in milliseconds (for staggered entrance)
   * @default 0
   */
  animationDelay?: number

  /**
   * Additional container styles
   */
  style?: ViewStyle
}
