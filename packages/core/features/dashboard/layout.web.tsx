'use client'

import { Button, Input, SizableText, XStack, YStack, useMedia, useTheme } from '@app/ui'
import { Dialog } from 'tamagui'
import { Bell, Menu, Search } from '@tamagui/lucide-icons'
import { StaticDrawer } from '@app/core/features/drawer-menu/StaticDrawer.web'
import { usePathname } from '@app/core/utils/usePathname'
import { useState } from 'react'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'
import { drawerSections } from '../drawer-menu/config'
import { normalizePath } from '../drawer-menu/utils'

export type DashboardLayoutProps = {
  children?: React.ReactNode
  padded?: boolean
  fullPage?: boolean
  headerTitle?: string
}

export const DashboardLayout = ({
  children,
  fullPage = false,
  padded = false,
  headerTitle,
}: DashboardLayoutProps) => {
  const media = useMedia()
  const [drawerOpen, setDrawerOpen] = useState(false)
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

  return (
    <XStack f={1} backgroundColor="$color1" height="100vh">
      {media.gtSm && <StaticDrawer />}
      <YStack f={1} minWidth={0} height="100vh">
        {!isDiscoverPage && (
          <XStack
            ai="center"
            px="$4"
            py="$3"
            borderBottomWidth={1}
            borderColor="$color4"
            backgroundColor="$color1"
            gap="$4"
            jc="space-between"
            flexShrink={0}
          >
            <XStack ai="center" gap="$3" flexShrink={1} minWidth={0}>
              {!media.gtSm && (
                <Dialog open={drawerOpen} onOpenChange={setDrawerOpen} modal>
                  <Dialog.Trigger asChild>
                    <Button
                      size="$4"
                      chromeless
                      icon={<Menu size={28} />}
                      onPress={() => setDrawerOpen(true)}
                    />
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay backgroundColor="rgba(0,0,0,0.4)" />
                    <Dialog.Content width={320} maxWidth="90%" animation="quick" gap="$0">
                      <StaticDrawer onNavigate={() => setDrawerOpen(false)} />
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog>
              )}
              <SizableText size="$6" fontWeight="700" flexShrink={1} minWidth={0}>
                {resolvedHeaderTitle}
              </SizableText>
            </XStack>
            <XStack ai="center" gap="$3" flexGrow={1} justifyContent="flex-end" minWidth={0}>
              <HeaderSearch />
              <NotificationButton />
            </XStack>
          </XStack>
        )}
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
          {children}
        </YStack>
      </YStack>
    </XStack>
  )
}

const HeaderSearch = () => {
  const [query, setQuery] = useState('')
  const theme = useTheme()
  const media = useMedia()

  const minWidth = media.gtSm ? 260 : media.gtXs ? 200 : 120
  const maxWidth = media.gtLg ? 480 : media.gtMd ? 380 : media.gtSm ? 320 : 260

  return (
    <XStack
      ai="center"
      gap="$2"
      px="$3"
      py="$2"
      flexGrow={1}
      flexShrink={1}
      minWidth={minWidth}
      maxWidth={maxWidth}
      borderRadius="$6"
      backgroundColor="$color2"
      borderWidth={1}
      borderColor="$color4"
    >
      <Search size={18} color={theme.color10.val} />
      <Input
        flexGrow={1}
        size="$3"
        borderWidth={0}
        backgroundColor="transparent"
        px="$0"
        py="$0"
        placeholder="Search"
        value={query}
        onChangeText={setQuery}
      />
    </XStack>
  )
}

const NotificationButton = () => {
  const theme = useTheme()

  return (
    <Button
      size="$3"
      circular
      borderWidth={1}
      borderColor="$color4"
      backgroundColor="$color2"
      hoverStyle={{ backgroundColor: '$color3', borderColor: '$color5' }}
      pressStyle={{ backgroundColor: '$color3', borderColor: '$color6' }}
      icon={<Bell size={18} color={theme.color10.val} />}
      accessibilityLabel="Open notifications"
      flexShrink={0}
    />
  )
}
