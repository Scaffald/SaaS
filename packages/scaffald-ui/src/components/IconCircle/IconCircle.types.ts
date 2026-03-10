/**
 * IconCircle component types
 */

import type { StyleProp, ViewStyle } from 'react-native'
import type { IconComponent } from '../types'

export interface IconCircleProps {
  /**
   * Icon component to render (e.g. from lucide-react-native)
   */
  icon: IconComponent
  /**
   * Size of the circle in pixels. Icon is rendered at ~50% of this.
   * @default 40
   */
  size?: number
  /**
   * Optional style override for the container
   */
  style?: StyleProp<ViewStyle>
}
