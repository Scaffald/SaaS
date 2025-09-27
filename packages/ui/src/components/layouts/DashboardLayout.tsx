import { XStack, YStack, useMedia } from '@app/ui'
import { AppHeader, AppHeaderProps } from './AppHeader'
import { ColumnWrapper } from './ColumnWrapper'

export type DashboardLayoutProps = {
  /**
   * Header configuration - if not provided, shows default header with hamburger menu
   */
  header?: AppHeaderProps | null
  /**
   * Left column content
   */
  leftContent?: React.ReactNode
  /**
   * Right column content
   */
  rightContent?: React.ReactNode
  /**
   * Left column width (can be number for pixels or string for percentage)
   */
  leftWidth?: number | string
  /**
   * Whether to hide the header completely
   */
  hideHeader?: boolean
  /**
   * Whether this is a home page (affects mobile layout)
   */
  isHomePage?: boolean
}

export const DashboardLayout = ({
  header,
  leftContent,
  rightContent,
  leftWidth = 300,
  hideHeader = false,
  isHomePage = false,
}: DashboardLayoutProps) => {
  const media = useMedia()

  // Default header with hamburger menu
  const defaultHeader: AppHeaderProps = {
    title: 'Dashboard',
    showMenuButton: true,
    showSearch: true,
    showNotifications: true,
  }

  return (
    <YStack f={1} backgroundColor="$color1" height="100vh">
      {/* Header */}
      {!hideHeader && <AppHeader {...(header === null ? {} : { ...defaultHeader, ...header })} />}

      {/* Main Content Area */}
      <YStack f={1}>
        {/* Mobile Layout: Stack vertically */}
        {!media.gtSm && (
          <YStack f={1}>
            {/* Mobile: Show left content on home pages, right content otherwise */}
            {isHomePage && leftContent ? (
              <ColumnWrapper>{leftContent}</ColumnWrapper>
            ) : (
              rightContent && <ColumnWrapper>{rightContent}</ColumnWrapper>
            )}
          </YStack>
        )}

        {/* Desktop Layout: Two columns side by side */}
        {media.gtSm && (
          <XStack f={1}>
            {/* Left Column */}
            {leftContent && (
              <YStack w={leftWidth} height="100%">
                <ColumnWrapper>{leftContent}</ColumnWrapper>
              </YStack>
            )}

            {/* Right Column */}
            {rightContent && (
              <YStack f={1} height="100%">
                <ColumnWrapper>{rightContent}</ColumnWrapper>
              </YStack>
            )}
          </XStack>
        )}
      </YStack>
    </YStack>
  )
}
