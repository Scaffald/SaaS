// @ts-nocheck

import { Slot, usePathname } from 'expo-router'
import { useMemo, useState } from 'react'
import { ScrollView, Theme, View, XStack, YStack } from 'tamagui'
import { FLAT_NAV_ITEMS, NAV_SECTIONS } from '../navigation'
import { StyleguideSidebar } from './Sidebar'
// TopNav has domain dependencies - exclude from standalone
// import { StyleguideTopNav } from './TopNav'

type StyleguideLayoutProps = {
  initialQuery?: string
}

export function StyleguideLayout({ initialQuery = '' }: StyleguideLayoutProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return FLAT_NAV_ITEMS
    }

    const normalized = searchQuery.trim().toLowerCase()
    return FLAT_NAV_ITEMS.filter((item) => {
      const haystack = [item.title, item.description, ...(item.tags ?? [])].join(' ').toLowerCase()
      return haystack.includes(normalized)
    })
  }, [searchQuery])

  return (
    <Theme name="light">
      <YStack flex={1} bg="$color1">
        {/* TopNav has domain dependencies - excluded from standalone */}
        <YStack p="$4" bg="$color1" borderBottomWidth={1} borderColor="$color6">
          <Text fontSize="$6" fontWeight="600">
            Component Styleguide
          </Text>
        </YStack>
        <XStack flex={1} borderTopWidth={1} borderColor="$color6">
          <StyleguideSidebar
            sections={NAV_SECTIONS}
            searchQuery={searchQuery}
            searchResults={searchResults}
            activePathname={pathname}
            onItemSelect={() => {
              setSearchQuery('')
            }}
          />
          <View flex={1} bg="$color2" borderLeftWidth={1} borderColor="$color6">
            <ScrollView
              testID="styleguide-content"
              aria-label="Styleguide content"
              contentContainerStyle={{
                padding: 32,
                gap: 32,
                alignItems: 'stretch',
              }}
            >
              <Slot />
            </ScrollView>
          </View>
        </XStack>
      </YStack>
    </Theme>
  )
}
