import { DashboardLayout } from '@app/core/features/dashboard/layout-refactored.web'
import { SettingsScreen } from './screen'

export type SettingsLayoutProps = {
  /**
   * web-only
   */
  isSettingsHome?: boolean
  /**
   * web-only
   */
  children?: React.ReactNode
}

export const SettingsLayout = ({ children, isSettingsHome = false }: SettingsLayoutProps) => {
  return (
    <DashboardLayout
      useTwoColumn={true}
      sidebar={<SettingsScreen />}
      isHomePage={isSettingsHome}
      fullPage={true}
    >
      {children}
    </DashboardLayout>
  )
}
