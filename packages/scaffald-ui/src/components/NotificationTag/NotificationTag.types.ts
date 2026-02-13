import type { ViewStyle } from 'react-native'
import type { ReactNode } from 'react'

export type NotificationTagSize = 'sm' | 'md'

export interface NotificationTagProps {
  size?: NotificationTagSize
  children?: ReactNode
  style?: ViewStyle
}
