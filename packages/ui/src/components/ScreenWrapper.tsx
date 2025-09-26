import { ReactNode } from 'react'
import { View } from 'tamagui'

import { FloatingBackButton, FloatingBackButtonProps } from './FloatingBackButton'

export interface ScreenWrapperProps {
  /**
   * The screen content to wrap
   */
  children: ReactNode
  /**
   * Whether to show the floating back button. Defaults to true
   */
  showBackButton?: boolean
  /**
   * Props to pass to the FloatingBackButton component
   * onPress is required for the back button to work
   */
  backButtonProps?: Omit<FloatingBackButtonProps, 'show'>
}

/**
 * A wrapper component that provides a consistent layout for screens with an optional floating back button.
 * This component should be used to wrap screen content when you want to show a floating back button
 * instead of the default header back button.
 *
 * @param props - ScreenWrapperProps
 * @returns JSX element
 */
export const ScreenWrapper = ({
  children,
  showBackButton = true,
  backButtonProps,
}: ScreenWrapperProps) => {
  return (
    <View flex={1} position="relative">
      {children}
      {showBackButton && backButtonProps?.onPress && (
        <FloatingBackButton show={showBackButton} {...backButtonProps} />
      )}
    </View>
  )
}

ScreenWrapper.displayName = 'ScreenWrapper'
