'use client'

import { PageLayoutWrapper, SingleColumnLayout, useMedia } from '@app/ui'
import { StaticDrawer } from '@app/core/features/drawer-menu/StaticDrawer.web'
import { drawerSections, normalizePath } from '@app/core/features/drawer-menu'
import { usePathname } from '@app/core/utils/usePathname'
import { useState } from 'react'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

export type HomeLayoutProps = {
  children?: React.ReactNode
  padded?: boolean
  fullPage?: boolean
  headerTitle?: string
  /**
   * Whether to use two-column layout (for settings, profile pages)
   */
  useTwoColumn?: boolean
  /**
   * Sidebar content for two-column layout
   */
  sidebar?: React.ReactNode
  /**
   * Whether this is a home page (affects mobile layout)
   */
  isHomePage?: boolean
}

export const HomeLayout = ({
  children,
  fullPage = false,
  padded = false,
  headerTitle,
  useTwoColumn = false,
  sidebar,
  isHomePage = false,
}: HomeLayoutProps) => {
  const media = useMedia()
  const [_drawerOpen, setDrawerOpen] = useState(false)
  const pathname = normalizePath(usePathname())

  const allNavItems = [
    ...drawerSections.flatMap((section) =>
      section.items.flatMap((item) => [item, ...(item.subItems ?? [])])
    ),
  ]
  const activeItem = allNavItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
  const resolvedHeaderTitle = headerTitle ?? activeItem?.title ?? 'Dashboard'
  const isDiscoverPage =
    pathname ===
    DASHBOARD_ROUTES.WORKERS?.childrenArray?.find((r) => r.path === '/dashboard/workers/map')
      ?.fullPath

  // For discover pages, hide header completely
  if (isDiscoverPage) {
    return (
      <PageLayoutWrapper hideHeader={true} fullPage={fullPage} padded={padded}>
        {children}
      </PageLayoutWrapper>
    )
  }

  // For two-column layouts (settings, profile)
  if (useTwoColumn && sidebar) {
    return (
      <PageLayoutWrapper
        header={{
          title: resolvedHeaderTitle,
          showMenuButton: !media.gtSm,
          onMenuPress: () => setDrawerOpen(true),
        }}
        layout="two-column"
        twoColumnProps={{
          sidebar,
          isHomePage,
          showSeparator: true,
          contentPadding: '$6',
        }}
        fullPage={fullPage}
        padded={padded}
      >
        {children}
      </PageLayoutWrapper>
    )
  }

  // For single-column layouts (dashboard, most pages)
  return (
    <PageLayoutWrapper
      header={{
        title: resolvedHeaderTitle,
        showMenuButton: !media.gtSm,
        onMenuPress: () => setDrawerOpen(true),
      }}
      layout="single-column"
      fullPage={fullPage}
      padded={padded}
    >
      <SingleColumnLayout
        centered={padded}
        maxWidth={padded ? 960 : undefined}
        padding={padded ? '$4' : '$6'}
      >
        {children}
      </SingleColumnLayout>
    </PageLayoutWrapper>
  )
}

// Mobile drawer dialog component
export const MobileDrawerDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Overlay backgroundColor="rgba(0,0,0,0.4)" />
        <Dialog.Content width={320} maxWidth="90%" animation="quick" gap="$0">
          <StaticDrawer onNavigate={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
