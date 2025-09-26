import { XStack, YStack, useMedia } from '@app/ui'
import { AppHeader, AppHeaderProps } from './AppHeader'
import { TwoColumnLayout, TwoColumnLayoutProps } from './TwoColumnLayout'

export type PageLayoutWrapperProps = {
  /**
   * Header configuration
   */
  header?: AppHeaderProps
  /**
   * Layout type - determines the main content structure
   */
  layout?: 'single-column' | 'two-column'
  /**
   * Two-column layout props (only used when layout is 'two-column')
   */
  twoColumnProps?: Omit<TwoColumnLayoutProps, 'children'>
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
}

export const PageLayoutWrapper = ({
  header,
  layout = 'single-column',
  twoColumnProps,
  children,
  hideHeader = false,
  fullPage = false,
  padded = false,
}: PageLayoutWrapperProps) => {
  const media = useMedia()

  return (
    <XStack f={1} backgroundColor="$color1" height="100vh">
      {/* Desktop Sidebar - only show for two-column layout */}
      {layout === 'two-column' && media.gtSm && twoColumnProps?.sidebar && (
        <YStack bg="$color1" w={300} $gtLg={{ w: 400 }} style={{ transition: '200ms ease width' }}>
          {twoColumnProps.sidebar}
        </YStack>
      )}

      {/* Main Content Area */}
      <YStack f={1} minWidth={0} height="100vh">
        {/* Header */}
        <AppHeader
          {...header}
          hidden={hideHeader}
          onMenuPress={() => {
            // This would typically open a mobile drawer
            // Implementation depends on the specific navigation system
          }}
        />

        {/* Content */}
        <YStack
          f={1}
          overflow="hidden"
          {...(fullPage && { flex: 1 })}
          {...(padded && {
            maw: 960,
            mx: 'auto',
            px: '$4',
            w: '100%',
          })}
        >
          {layout === 'two-column' ? (
            <TwoColumnLayout {...twoColumnProps}>{children}</TwoColumnLayout>
          ) : (
            children
          )}
        </YStack>
      </YStack>
    </XStack>
  )
}
