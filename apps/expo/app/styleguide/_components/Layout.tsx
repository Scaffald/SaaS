// @ts-nocheck
import { useMemo, useState } from 'react'
import { Slot, usePathname } from 'expo-router'
import { ScrollView, Theme, View, XStack, YStack } from '@app/ui'
import { APPROVAL_COUNT } from '../data/todos'
import { FLAT_NAV_ITEMS, NAV_SECTIONS } from '../navigation/sections'
import { StyleguideSidebar } from './Sidebar'
import { StyleguideTopNav } from './TopNav'

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
      const haystack = [item.title, item.description, ...(item.tags ?? [])]
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }, [searchQuery])

  return (
    <Theme name="light">
      <YStack flex={1} backgroundColor="$color1">
        <StyleguideTopNav
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          approvalCount={APPROVAL_COUNT}
        />
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
          <View flex={1} backgroundColor="$color2" borderLeftWidth={1} borderColor="$color6">
            <ScrollView
              testID="styleguide-content"
              accessibilityLabel="Styleguide content"
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
