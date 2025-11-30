// @ts-nocheck

import { Link } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { isWeb, ScrollView, Separator, Text, View, XStack, YStack } from 'tamagui'
import { Button } from '../../components/buttons/Button'
import type { NavItem, NavSection } from '../navigation/sections'

type SidebarProps = {
  sections: NavSection[]
  searchQuery: string
  searchResults: NavItem[]
  activePathname: string | null
  onItemSelect?: () => void
}

const STORAGE_KEY = 'styleguide.sidebar.state'

type SidebarState = Record<string, boolean>

export function StyleguideSidebar({
  sections,
  searchQuery,
  searchResults,
  activePathname,
  onItemSelect,
}: SidebarProps) {
  const [openSections, setOpenSections] = useState<SidebarState>(() => {
    if (isWeb && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          return JSON.parse(stored) as SidebarState
        } catch (error) {
          console.warn('Failed to parse sidebar state', error)
        }
      }
    }

    return Object.fromEntries(sections.map((section) => [section.id, true]))
  })

  useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(openSections))
  }, [openSections])

  const visibleSections = useMemo(() => {
    if (!searchQuery.trim()) {
      return sections
    }

    return [
      {
        id: 'search',
        title: `Search results for "${searchQuery}"`,
        items: searchResults.length
          ? searchResults
          : [
              {
                title: 'No results',
                href: '/styleguide',
                description: 'Try a different keyword or clear search.',
              },
            ],
      },
    ] as NavSection[]
  }, [searchQuery, searchResults, sections])

  const handleToggleSection = useCallback((sectionId: string) => {
    setOpenSections((previous) => ({
      ...previous,
      [sectionId]: !previous[sectionId],
    }))
  }, [])

  const renderItem = useCallback(
    (item: NavItem) => {
      const isActive = activePathname ? activePathname === item.href : false
      const isAncestor = activePathname ? activePathname.startsWith(item.href) && !isActive : false

      return (
        <Link key={item.href} href={item.href} asChild>
          <Button
            unstyled
            alignItems="flex-start"
            paddingVertical={10}
            paddingHorizontal={16}
            borderRadius={8}
            bg={isActive ? '$color5' : 'transparent'}
            hoverStyle={{ backgroundColor: '$color4' }}
            pressStyle={{ backgroundColor: '$color5' }}
            onPress={onItemSelect}
          >
            <YStack gap={4}>
              <Text
                fontSize={13}
                fontWeight={isActive || isAncestor ? '700' : '500'}
                color="$color11"
              >
                {item.title}
              </Text>
              {item.description ? (
                <Text fontSize={11} color="$color10">
                  {item.description}
                </Text>
              ) : null}
            </YStack>
          </Button>
        </Link>
      )
    },
    [activePathname, onItemSelect]
  )

  return (
    <View
      width={320}
      maxWidth={360}
      bg="$color2"
      borderRightWidth={1}
      borderColor="$color6"
      $sm={{ display: 'none' }}
    >
      <ScrollView
        contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 16, gap: 16 }}
        aria-label="Styleguide navigation"
      >
        {visibleSections.map((section) => {
          const open = openSections[section.id] ?? true
          const isSearch = section.id === 'search'

          return (
            <YStack key={section.id} gap={8}>
              <XStack
                justify="space-between"
                alignItems="center"
                paddingHorizontal={12}
                paddingVertical={4}
                borderRadius={6}
                bg="$color3"
                hoverStyle={{ backgroundColor: '$color4' }}
                pressStyle={{ backgroundColor: '$color5' }}
                cursor="pointer"
                onPress={() => {
                  if (!isSearch) {
                    handleToggleSection(section.id)
                  }
                }}
              >
                <Text fontSize={12} textTransform="uppercase" letterSpacing={1} color="$color10">
                  {section.title}
                </Text>
                {!isSearch ? (
                  <Text fontSize={12} color="$color10">
                    {open ? '−' : '+'}
                  </Text>
                ) : null}
              </XStack>
              {isSearch || open ? <YStack gap={4}>{section.items.map(renderItem)}</YStack> : null}
              <Separator borderColor="$color5" />
            </YStack>
          )
        })}
      </ScrollView>
    </View>
  )
}
