import { YStack } from '@app/ui'
import { AppHeader, AppHeaderProps } from './AppHeader.native'
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
  /**
   * Main content (for backward compatibility)
   */
  children?: React.ReactNode
}

export const DashboardLayout = ({
  header,
  leftContent,
  rightContent,
  leftWidth = 300,
  hideHeader = false,
  isHomePage = false,
  children,
}: DashboardLayoutProps) => {
  // Default header with hamburger menu
  const defaultHeader: AppHeaderProps = {
    title: 'Dashboard',
    showMenuButton: true,
    showNotifications: true,
  }

  // For mobile, prioritize leftContent on home pages, otherwise rightContent
  const mobileContent =
    isHomePage && leftContent ? leftContent : rightContent || leftContent || children

  return (
    <YStack f={1} backgroundColor="$color1">
      {/* Header */}
      {!hideHeader && <AppHeader {...(header === null ? {} : { ...defaultHeader, ...header })} />}

      {/* Content */}
      <ColumnWrapper>{mobileContent}</ColumnWrapper>
    </YStack>
  )
}
