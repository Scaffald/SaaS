import { YStack } from '@app/ui'
import { AppHeader, AppHeaderProps } from './AppHeader.native'
import { FloatingBackButton } from '../FloatingBackButton'

export type PageLayoutWrapperProps = {
  /**
   * Header configuration
   */
  header?: AppHeaderProps
  /**
   * Main content
   */
  children: React.ReactNode
  /**
   * Whether to hide the header completely
   */
  hideHeader?: boolean
  /**
   * Whether to show the floating back button
   */
  showFloatingBackButton?: boolean
  /**
   * Whether to use full page layout (no padding constraints)
   */
  fullPage?: boolean
  /**
   * Whether to add padding constraints for content
   */
  padded?: boolean
  /**
   * Content padding
   */
  contentPadding?: number | string
}

export const PageLayoutWrapper = ({
  header,
  children,
  hideHeader = false,
  showFloatingBackButton = true,
  fullPage = false,
  padded = false,
  contentPadding = '$4',
}: PageLayoutWrapperProps) => {
  return (
    <YStack f={1} backgroundColor="$color1">
      {/* Header */}
      <AppHeader {...header} hidden={hideHeader} />

      {/* Content */}
      <YStack
        f={1}
        p={contentPadding}
        {...(padded && {
          maw: 960,
          mx: 'auto',
          w: '100%',
        })}
      >
        {children}
      </YStack>

      {/* Floating Back Button */}
      {showFloatingBackButton && !hideHeader && <FloatingBackButton />}
    </YStack>
  )
}
