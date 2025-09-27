import { YStack } from '@app/ui'
import { AppHeader, AppHeaderProps } from './AppHeader.native'
import { ColumnWrapper } from './ColumnWrapper'

export type DashboardLayoutProps = {
  /**
   * Header configuration - if not provided, shows default header with hamburger menu
   */
  header?: AppHeaderProps | null
  /**
   * Main content
   */
  children: React.ReactNode
  /**
   * Whether to hide the header completely
   */
  hideHeader?: boolean
}

export const DashboardLayout = ({ header, children, hideHeader = false }: DashboardLayoutProps) => {
  // Default header with hamburger menu
  const defaultHeader: AppHeaderProps = {
    title: 'Dashboard',
    showMenuButton: true,
    showNotifications: true,
  }

  return (
    <YStack f={1} backgroundColor="$color1">
      {/* Header */}
      {!hideHeader && <AppHeader {...(header === null ? {} : { ...defaultHeader, ...header })} />}

      {/* Content */}
      <ColumnWrapper>{children}</ColumnWrapper>
    </YStack>
  )
}
