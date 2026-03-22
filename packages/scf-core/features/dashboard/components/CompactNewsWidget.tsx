import { useAggregatedNews } from '@scf/core/features/news/hooks/useNewsFeed'
import { useNewsIndustryResolution } from '@scf/core/features/news/hooks/useNewsIndustryResolution'
import { useIndustries } from '@scf/core/utils/industries-sdk-hooks'
import {
  Button,
  DashboardWidget,
  Popover,
  PopoverContent,
  Row,
  Skeleton,
  SkeletonGroup,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import * as WebBrowser from 'expo-web-browser'
import { ChevronDown, RefreshCw } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Image, Platform, Pressable } from 'react-native'

const formatTimeAgo = (date: Date | string) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  const hours = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days}d ago`
  return dateObj.toLocaleDateString()
}

function NewsItem({ item }: { item: { title?: string; link?: string; imageUrl?: string | null; pubDate: Date | string } }) {
  const { theme } = useThemeContext()

  const handlePress = () => {
    const url = item.link
    if (!url) return
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener')
    } else {
      WebBrowser.openBrowserAsync(url).catch(() => {})
    }
  }

  return (
    <Pressable onPress={handlePress} style={{ flexDirection: 'row', gap: 12 }}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 8,
            backgroundColor: colors.bg[theme].muted,
          }}
          resizeMode="cover"
        />
      ) : (
        <Stack
          style={{
            width: 64,
            height: 64,
            borderRadius: 8,
            backgroundColor: colors.bg[theme].muted,
          }}
        />
      )}
      <Stack gap={4} flex={1} justify="center">
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: colors.text[theme].primary,
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: colors.text[theme].secondary,
          }}
        >
          {formatTimeAgo(item.pubDate)}
        </Text>
      </Stack>
    </Pressable>
  )
}

export function CompactNewsWidget() {
  const { theme } = useThemeContext()
  const t: 'light' | 'dark' = theme === 'dark' ? 'dark' : 'light'
  const [selectedSlug, setSelectedSlug] = useState<string>('construction')
  const [industryOpen, setIndustryOpen] = useState(false)

  const { effectiveIndustryId } = useNewsIndustryResolution({
    industrySlug: selectedSlug,
    useUserIndustry: selectedSlug === 'construction',
  })

  const { data: newsItems, isLoading, refetch, isFetching } = useAggregatedNews({
    industryId: effectiveIndustryId ?? '',
    maxTotalItems: 3,
    enabled: !!effectiveIndustryId,
  })

  const { data: industriesData } = useIndustries()
  const industries = (industriesData as { industries?: { id: string; name: string; slug: string }[] })?.industries ?? []

  const selectedName = industries.find((ind) => ind.slug === selectedSlug)?.name ?? selectedSlug.charAt(0).toUpperCase() + selectedSlug.slice(1)

  const handleRefresh = useCallback(() => {
    void refetch()
  }, [refetch])

  const handleSelectIndustry = useCallback((slug: string) => {
    setSelectedSlug(slug)
    setIndustryOpen(false)
  }, [])

  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={16} animation="wave">
          <Skeleton width={60} height={18} borderRadius={4} />
          {[1, 2].map((i) => (
            <Row key={i} gap={12}>
              <Skeleton width={64} height={64} borderRadius={8} />
              <Stack gap={4} flex={1}>
                <Skeleton width="90%" height={14} />
                <Skeleton width="60%" height={14} />
                <Skeleton width={80} height={10} />
              </Stack>
            </Row>
          ))}
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  const items = (newsItems ?? []).slice(0, 3)

  if (items.length === 0) return null

  return (
    <DashboardWidget>
      <Row justify="space-between" align="center" paddingBottom={8}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: colors.text[t].primary,
          }}
        >
          News
        </Text>
        <Row align="center" gap={8}>
          <Popover
            placement="bottom"
            open={industryOpen}
            onOpenChange={setIndustryOpen}
            trigger="manual"
            content={
              <PopoverContent>
                <Stack style={{ minWidth: 180, paddingVertical: 4 }}>
                  {industries.length > 0 ? (
                    industries.map((ind) => (
                      <Pressable
                        key={ind.id}
                        onPress={() => handleSelectIndustry(ind.slug)}
                        style={({ pressed }) => ({
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 8,
                          marginHorizontal: 4,
                          backgroundColor: ind.slug === selectedSlug
                            ? colors.bg[t].selected
                            : pressed
                              ? colors.bg[t].subtle
                              : 'transparent',
                        })}
                      >
                        <Text
                          size="sm"
                          weight={ind.slug === selectedSlug ? 'semibold' : 'regular'}
                          style={{ color: colors.text[t].primary }}
                        >
                          {ind.name}
                        </Text>
                      </Pressable>
                    ))
                  ) : (
                    <Text size="sm" style={{ color: colors.text[t].secondary, paddingHorizontal: 16, paddingVertical: 8 }}>
                      No industries available
                    </Text>
                  )}
                </Stack>
              </PopoverContent>
            }
          >
            <Pressable
              onPress={() => setIndustryOpen(!industryOpen)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
                backgroundColor: pressed ? colors.bg[t].subtle : colors.bg[t].muted,
                borderWidth: 1,
                borderColor: colors.border[t].ghost,
              })}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: colors.text[t].secondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {selectedName}
              </Text>
              <ChevronDown size={10} color={colors.text[t].secondary} />
            </Pressable>
          </Popover>
          <Pressable
            onPress={handleRefresh}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : isFetching ? 0.4 : 0.7 })}
            disabled={isFetching}
          >
            <RefreshCw size={14} color={colors.icon[t].default} />
          </Pressable>
        </Row>
      </Row>

      <Stack gap={20}>
        {items.map((item, i) => (
          <NewsItem key={`news-${i}-${(item as Record<string, unknown>).link ?? ''}`} item={item as never} />
        ))}
      </Stack>

      <Button
        variant="outline"
        color="gray"
        size="sm"
        fullWidth
        style={{ marginTop: 8 }}
      >
        Show more
      </Button>
    </DashboardWidget>
  )
}
