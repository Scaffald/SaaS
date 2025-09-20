'use client'

import {
  Paragraph,
  SizableText,
  XStack,
  YStack,
  Separator,
  Button,
} from '@my/ui'
import { CircleUser } from '@tamagui/lucide-icons'
import { SolitoImage } from 'solito/image'
import { useLink } from 'solito/link'
import { useMemo } from 'react'

import {
  DrawerItemConfig,
  DrawerSectionConfig,
  drawerSections,
  quickLinks,
} from './index'
import { usePathname } from 'app/utils/usePathname'
import { useUser } from 'app/utils/useUser'

const isActivePath = (pathname: string, href: string) => {
  if (href === '/') {
    return pathname === '/' || pathname === '/index'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

const DrawerLink = ({
  item,
  pathname,
  onNavigate,
}: {
  item: DrawerItemConfig
  pathname: string
  onNavigate?: () => void
}) => {
  const link = useLink({ href: item.href })
  const active = isActivePath(pathname, item.href)
  const Icon = item.icon

  return (
    <Button
      {...link}
      accessibilityRole="button"
      justifyContent="flex-start"
      width="100%"
      size="$4"
      borderRadius="$3"
      backgroundColor={active ? '$purple3' : 'transparent'}
      color={active ? '$purple12' : '$gray11'}
      icon={<Icon size={20} color={active ? '$purple11' : '$gray10'} />}
      iconAfter={null}
      disabled={item.disabled}
      theme={active ? 'purple' : null}
      onPress={(event) => {
        link.onPress?.(event)
        onNavigate?.()
      }}
    >
      <YStack alignItems="flex-start" gap="$1">
        <SizableText size="$4" fontWeight="600">
          {item.title}
        </SizableText>
        {item.description ? (
          <Paragraph size="$2" color="$gray10">
            {item.description}
          </Paragraph>
        ) : null}
      </YStack>
    </Button>
  )
}

const DrawerSection = ({
  section,
  pathname,
  onNavigate,
}: {
  section: DrawerSectionConfig
  pathname: string
  onNavigate?: () => void
}) => {
  return (
    <YStack gap="$2">
      <SizableText size="$2" fontWeight="600" color="$gray10" textTransform="uppercase">
        {section.title}
      </SizableText>
      <YStack gap="$1">
        {section.items.map((item) => (
          <YStack key={item.key} gap="$1">
            <DrawerLink item={item} pathname={pathname} onNavigate={onNavigate} />
            {item.subItems?.map((sub) => (
              <DrawerLink key={sub.key} item={sub} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </YStack>
        ))}
      </YStack>
    </YStack>
  )
}

export const StaticDrawer = ({ onNavigate }: { onNavigate?: () => void } = {}) => {
  const pathname = usePathname()
  const { profile, avatarUrl, user } = useUser()

  const sections = useMemo(() => drawerSections, [])

  return (
    <YStack
      f={1}
      h="100%"
      backgroundColor="$color1"
      borderRightWidth={1}
      borderColor="$color4"
      padding="$4"
      gap="$5"
      maxWidth={320}
      width="100%"
      flexShrink={0}
    >
      <XStack alignItems="center" gap="$3">
        <XStack
          width="$4.5"
          height="$4.5"
          borderRadius="$3"
          backgroundColor="$purple3"
          alignItems="center"
          justifyContent="center"
        >
          <CircleUser size={24} color="$purple11" />
        </XStack>
        <YStack f={1} gap="$1">
          <SizableText size="$5" fontWeight="700" color="$gray12">
            {profile?.name ?? 'Store Name'}
          </SizableText>
          <Paragraph size="$2" color="$gray10">
            Synced moments ago
          </Paragraph>
        </YStack>
      </XStack>

      <YStack gap="$5" flex={1}>
        {sections.map((section) => (
          <DrawerSection key={section.key} section={section} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </YStack>

      <YStack gap="$4">
        <Separator borderColor="$color4" />
        <YStack gap="$2">
          {quickLinks.map((item) => (
            <DrawerLink key={item.key} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </YStack>
        <XStack backgroundColor="$gray2" borderRadius="$4" px="$4" py="$4" gap="$3" alignItems="center">
          <SolitoImage
            src={avatarUrl}
            alt="Profile avatar"
            width={32}
            height={32}
            style={{ borderRadius: 999 }}
          />
          <YStack f={1} gap="$1">
            <SizableText size="$4" fontWeight="600" color="$gray12">
              {profile?.name ?? 'No Name'}
            </SizableText>
            <Paragraph size="$2" color="$gray10">
              {user?.email ?? 'View profile'}
            </Paragraph>
          </YStack>
        </XStack>
      </YStack>
    </YStack>
  )
}
