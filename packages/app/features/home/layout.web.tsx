'use client'

import {
  Avatar,
  Button,
  type ButtonProps,
  SizableText,
  Theme,
  XStack,
  YStack,
  getTokens,
  useMedia,
} from '@my/ui'
import { Dialog } from 'tamagui'
import { Map as MapIcon, Menu } from '@tamagui/lucide-icons'
import { StaticDrawer } from 'app/features/drawer-menu/StaticDrawer.web'
import { drawerSections, normalizePath, quickLinks } from 'app/features/drawer-menu'
import { usePathname } from 'app/utils/usePathname'
import { useUser } from 'app/utils/useUser'
import { useState } from 'react'
import { SolitoImage } from 'solito/image'
import { Link, useLink } from 'solito/link'

export type HomeLayoutProps = {
  children?: React.ReactNode
  padded?: boolean
  fullPage?: boolean
}

export const HomeLayout = ({ children, fullPage = false, padded = false }: HomeLayoutProps) => {
  const media = useMedia()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = normalizePath(usePathname())

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

  return (
    <XStack f={1} backgroundColor="$color1">
      {media.gtSm && <StaticDrawer />}
      <YStack f={1}>
        <XStack
          ai="center"
          jc="space-between"
          px="$4"
          py="$3"
          borderBottomWidth={1}
          borderColor="$color4"
          backgroundColor="$color1"
        >
          <XStack ai="center" gap="$3">
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
            <SizableText size="$6" fontWeight="700">
              {headerTitle}
            </SizableText>
          </XStack>
          <XStack ai="center" gap="$3">
            <CtaButton />
            <ProfileButton />
          </XStack>
        </XStack>
        <YStack
          f={1}
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

const UserAvatar = () => {
  const { avatarUrl } = useUser()

  return (
    <Avatar size="$2" circular>
      <SolitoImage
        src={avatarUrl}
        alt="your avatar"
        width={getTokens().size['2'].val}
        height={getTokens().size['2'].val}
      />
    </Avatar>
  )
}

const CtaButton = (props: ButtonProps) => {
  const discoverLink = useLink({ href: '/discover' })

  return (
    <Theme inverse>
      <Button {...discoverLink} size="$3" space="$1.5" my="$-1" icon={MapIcon} br="$10" {...props}>
        Discover
      </Button>
    </Theme>
  )
}

const ProfileButton = () => (
  <Link href="/profile">
    <UserAvatar />
  </Link>
)
