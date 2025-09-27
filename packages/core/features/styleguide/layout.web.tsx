import { DashboardLayout } from '@app/ui'
import { StyleguideScreen } from './screen'

export type StyleguideLayoutProps = {
  /**
   * web-only
   */
  isStyleguideHome?: boolean
  /**
   * web-only
   */
  children?: React.ReactNode
}

export const StyleguideLayout = ({ children, isStyleguideHome = false }: StyleguideLayoutProps) => {
  return (
    <DashboardLayout
      leftContent={<StyleguideScreen />}
      rightContent={children}
      isHomePage={isStyleguideHome}
    />
  )
}
