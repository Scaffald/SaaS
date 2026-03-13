import type { ViewStyle } from 'react-native'

export interface AssessmentOptionCardProps {
  /**
   * Option text to display
   */
  label: string

  /**
   * Whether this option is currently selected
   */
  isSelected: boolean

  /**
   * Callback when option is pressed
   */
  onPress: () => void

  /**
   * Whether the option is disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Index for staggered entrance animation delay
   */
  index?: number

  /**
   * Additional container styles
   */
  style?: ViewStyle
}
