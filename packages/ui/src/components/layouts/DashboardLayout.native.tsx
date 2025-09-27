import { YStack } from '@app/ui'
import { AppHeader, AppHeaderProps } from './AppHeader.native'

export type DashboardLayoutProps = {
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

export const DashboardLayout = ({
  header,
  children,
  hideHeader = false,
  fullPage = false,
  padded = false,
  contentPadding = '$4',
}: DashboardLayoutProps) => {
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
    </YStack>
  )
}
