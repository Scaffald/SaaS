'use client'

import { Button, Input, SizableText, XStack, YStack, useMedia, useDidFinishSSR } from '@app/ui'
import { Dialog } from 'tamagui'
import { Bell, Menu, Search } from '@tamagui/lucide-icons'
import { StaticDrawer } from '@app/features/drawer-menu/StaticDrawer.web'
import { drawerSections, normalizePath, quickLinks } from '@app/features/drawer-menu'
import { usePathname } from '@app/utils/usePathname'
import { useState } from 'react'

export type HeaderRenderProps = {
  drawerTrigger: React.ReactNode
  headerTitle: string
  headerRight: React.ReactNode
  isDesktop: boolean
}

export type HomeLayoutProps = {
  children?: React.ReactNode
  padded?: boolean
  fullPage?: boolean
  renderHeader?: (props: HeaderRenderProps) => React.ReactNode
}

export const HomeLayout = ({
  children,
  fullPage = false,
  padded = false,
  renderHeader,
}: HomeLayoutProps) => {
  const media = useMedia()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = normalizePath(usePathname())
  const isHydrated = useDidFinishSSR()

  const allNavItems = [
    ...drawerSections.flatMap((section) =>
      section.items.flatMap((item) => [item, ...(item.subItems ?? [])])
    ),
    ...quickLinks,
  ]
  const activeItem = allNavItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
  const headerTitle = activeItem?.title ?? 'Dashboard'

  const drawerTrigger =
    !media.gtSm && isHydrated ? (
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
    ) : null

  const headerRight = (
    <XStack ai="center" gap="$3" flexGrow={1} justifyContent="flex-end" minWidth={0}>
      <HeaderSearch />
      <NotificationButton />
    </XStack>
  )

  const defaultHeader = (
    <XStack ai="center" gap="$4" jc="space-between" width="100%">
      <XStack ai="center" gap="$3" flexShrink={1} minWidth={0}>
        {drawerTrigger}
        <SizableText size="$6" fontWeight="700" flexShrink={1} minWidth={0}>
          {headerTitle}
        </SizableText>
      </XStack>
      {headerRight}
    </XStack>
  )

  const headerContent = renderHeader
    ? renderHeader({
        drawerTrigger,
        headerTitle,
        headerRight,
        isDesktop: media.gtSm,
      })
    : defaultHeader

  return (
    <XStack f={1} backgroundColor="$color1" minHeight="100vh">
      {media.gtSm && <StaticDrawer />}
      <YStack f={1} minWidth={0} height="100vh" overflow="hidden">
        <YStack flex={1} overflow="auto" backgroundColor="$color1">
          <YStack minHeight="100%" backgroundColor="$color1">
            <YStack
              px="$4"
              py="$3"
              borderBottomWidth={1}
              borderColor="$color4"
              backgroundColor="$color1"
              gap="$4"
              position="sticky"
              top={0}
              zIndex={10}
            >
              {headerContent}
            </YStack>
            <YStack
              flexGrow={1}
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
        </YStack>
      </YStack>
    </XStack>
  )
}

const HeaderSearch = () => {
  const [query, setQuery] = useState('')
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
      <Search size={18} color="$color10" />
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
  return (
    <Button
      size="$3"
      circular
      borderWidth={1}
      borderColor="$color4"
      backgroundColor="$color2"
      hoverStyle={{ backgroundColor: '$color3', borderColor: '$color5' }}
      pressStyle={{ backgroundColor: '$color3', borderColor: '$color6' }}
      icon={<Bell size={18} color="$color10" />}
      accessibilityLabel="Open notifications"
      flexShrink={0}
    />
  )
}
