import { TwoColumnLayout, TwoColumnSidebarSkeleton, TwoColumnContentSkeleton } from '@app/ui'
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
    <TwoColumnLayout
      sidebar={<StyleguideScreen />}
      isHomePage={isStyleguideHome}
      isLoading={false}
      sidebarSkeleton={<TwoColumnSidebarSkeleton />}
      contentSkeleton={<TwoColumnContentSkeleton />}
    >
      {children}
    </TwoColumnLayout>
  )
}
