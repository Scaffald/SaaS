import { Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Briefcase, Hammer, Search as SearchIcon } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import type { SearchResultType, UniversalSearchGroup, UniversalSearchResult } from './types'
import { useUniversalSearch } from './useUniversalSearch'

const TYPE_ICON: Record<SearchResultType, typeof Briefcase> = {
  job: Briefcase,
  skill: Hammer,
  professional: SearchIcon,
}

// Tappable suggestions shown on the empty search screen so a first-time user
// has a way in instead of a blank page (SC-34 / audit F3).
const SUGGESTED_TRADES = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'Welder',
  'HVAC Technician',
  'Scaffold Builder',
]

function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function ResultRow({ item }: { item: UniversalSearchResult }) {
  const { theme } = useThemeContext()
  const router = useRouter()
  const Icon = TYPE_ICON[item.type] ?? SearchIcon

  return (
    <Pressable
      onPress={() => router.push(item.route)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: pressed ? colors.bg[theme].subtle : 'transparent',
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.bg[theme].subtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color={colors.icon[theme].default} />
      </View>
      <Stack flex={1} gap={2}>
        <Text
          size="sm"
          weight="semibold"
          style={{ color: colors.text[theme].primary }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text
            size="xs"
            style={{ color: colors.text[theme].secondary }}
            numberOfLines={1}
          >
            {item.subtitle}
          </Text>
        ) : null}
      </Stack>
    </Pressable>
  )
}

function Group({ group }: { group: UniversalSearchGroup }) {
  const { theme } = useThemeContext()
  const router = useRouter()

  if (!group.isLoading && group.results.length === 0) return null

  return (
    <Stack gap={4} style={{ paddingTop: 12 }}>
      <Row
        justify="space-between"
        align="center"
        style={{ paddingHorizontal: 16, paddingBottom: 4 }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: colors.text[theme].tertiary,
          }}
        >
          {group.label}
        </Text>
        {group.seeAllRoute ? (
          <Pressable
            onPress={() => router.push(group.seeAllRoute!)}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.primary[600],
              }}
            >
              See all
            </Text>
          </Pressable>
        ) : null}
      </Row>
      {group.isLoading ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      ) : (
        group.results.map((item) => <ResultRow key={`${group.type}-${item.id}`} item={item} />)
      )}
    </Stack>
  )
}

export function SearchScreen() {
  const { theme } = useThemeContext()
  const params = useLocalSearchParams<{ q?: string }>()
  const initial = typeof params.q === 'string' ? params.q : ''
  const [query, setQuery] = useState(initial)
  const debounced = useDebounced(query, 250)
  const { groups, isLoading, isEmpty } = useUniversalSearch(debounced)

  useEffect(() => {
    if (typeof params.q === 'string' && params.q !== query) {
      setQuery(params.q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q])

  const trimmed = debounced.trim()
  const showPlaceholder = trimmed.length < 2

  const content = useMemo(() => {
    if (showPlaceholder) {
      return (
        <Stack gap={24} style={{ padding: 24 }}>
          <Stack gap={8} style={{ alignItems: 'center' }}>
            <SearchIcon size={32} color={colors.icon[theme].muted} />
            <Text
              size="sm"
              style={{ color: colors.text[theme].secondary, textAlign: 'center' }}
            >
              Search jobs, skills, and more
            </Text>
          </Stack>
          <Stack gap={10}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: colors.text[theme].tertiary,
              }}
            >
              Popular trades
            </Text>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {SUGGESTED_TRADES.map((trade) => (
                <Pressable
                  key={trade}
                  onPress={() => setQuery(trade)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Search for ${trade}`}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    minHeight: 44,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.border[theme].default,
                    backgroundColor: pressed
                      ? colors.bg[theme].subtle
                      : colors.bg[theme].default,
                  })}
                >
                  <Hammer size={14} color={colors.icon[theme].muted} />
                  <Text size="sm" style={{ color: colors.text[theme].primary }}>
                    {trade}
                  </Text>
                </Pressable>
              ))}
            </Row>
          </Stack>
        </Stack>
      )
    }
    if (isLoading && groups.every((g) => g.results.length === 0)) {
      return (
        <View style={{ padding: 24 }}>
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      )
    }
    if (isEmpty) {
      return (
        <Stack gap={6} style={{ padding: 24, alignItems: 'center' }}>
          <Text
            size="sm"
            weight="semibold"
            style={{ color: colors.text[theme].primary }}
          >
            No results for “{trimmed}”
          </Text>
          <Text
            size="xs"
            style={{ color: colors.text[theme].secondary, textAlign: 'center' }}
          >
            Try a different keyword or check spelling.
          </Text>
        </Stack>
      )
    }
    return (
      <Stack gap={8} style={{ paddingVertical: 8 }}>
        {groups.map((g) => (
          <Group key={g.type} group={g} />
        ))}
      </Stack>
    )
  }, [showPlaceholder, isLoading, isEmpty, groups, trimmed, theme])

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg[theme].default }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {content}
      </ScrollView>
    </View>
  )
}
