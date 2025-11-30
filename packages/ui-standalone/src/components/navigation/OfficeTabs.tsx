import { Link } from 'expo-router'
import { type JSX, useMemo } from 'react'
import {
  Button,
  type ButtonProps,
  Paragraph,
  ScrollView,
  useWindowDimensions,
  XStack,
  YStack,
} from 'tamagui'

export type OfficeTabsItem = {
  key: string
  label: string
  href: string
  badge?: string
  isActive?: boolean
  buttonProps?: ButtonProps
}

export type OfficeTabsProps = {
  items: OfficeTabsItem[]
  currentPath: string
  ariaLabel?: string
}

const isPathActive = (currentPath: string, targetHref: string) => {
  if (!targetHref) return false

  if (currentPath === targetHref) {
    return true
  }

  const base = targetHref.split('/:')[0]
  if (!base) {
    return false
  }

  return currentPath === base || currentPath.startsWith(`${base}/`)
}

export const OfficeTabs = ({
  items,
  currentPath,
  ariaLabel = 'Office navigation',
}: OfficeTabsProps) => {
  // Use window dimensions for conditional rendering
  // Breakpoint: 800px (matches Tamagui $sm/$md breakpoint)
  const { width } = useWindowDimensions()
  const isSmallScreen = width <= 800

  const normalizedItems = useMemo(
    () =>
      items.map((item) => {
        const active = item.isActive ?? isPathActive(currentPath, item.href)
        return { ...item, isActive: active }
      }),
    [currentPath, items]
  )

  const renderTabButton = ({
    key,
    label,
    href,
    badge,
    isActive,
    buttonProps,
  }: OfficeTabsItem): JSX.Element => {
    const active = Boolean(isActive)

    const button = (
      <Button
        key={key}
        role="tab"
        aria-selected={active}
        variant={active ? undefined : 'outlined'}
        size="$3"
        borderColor={active ? '$color9' : '$borderColor'}
        bg={active ? '$color9' : 'transparent'}
        hoverStyle={{
          bg: active ? '$color9' : '$color3',
        }}
        pressStyle={{
          bg: active ? '$color9' : '$color4',
        }}
        {...buttonProps}
      >
        <XStack gap="$2" items="center">
          <Paragraph fontWeight="600" color={active ? '$color1' : '$color11'}>
            {label}
          </Paragraph>
          {badge ? (
            <YStack
              px="$2"
              py="$1"
              bg={active ? '$color2' : '$color4'}
              rounded="$10"
              items="center"
              justify="center"
            >
              <Paragraph size="$1" color={active ? '$color10' : '$color11'}>
                {badge}
              </Paragraph>
            </YStack>
          ) : null}
        </XStack>
      </Button>
    )

    return (
      <Link key={key} href={href} asChild>
        {button}
      </Link>
    )
  }

  if (isSmallScreen) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack px="$4" py="$2" gap="$2" role="tablist" aria-label={ariaLabel}>
          {normalizedItems.map(renderTabButton)}
        </XStack>
      </ScrollView>
    )
  }

  return (
    <YStack px="$4">
      <XStack gap="$2" role="tablist" aria-label={ariaLabel} flexWrap="wrap">
        {normalizedItems.map(renderTabButton)}
      </XStack>
    </YStack>
  )
}
