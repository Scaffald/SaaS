import { useAggregatedNews } from '@scf/core/features/news/hooks/useNewsFeed'
import { useNewsIndustryResolution } from '@scf/core/features/news/hooks/useNewsIndustryResolution'
import {
  DashboardWidget,
  Row,
  Skeleton,
  SkeletonGroup,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { Image, Pressable, View } from 'react-native'
import { openExternalLink } from '@scf/core/utils/platform'

function NewsItem({
  item,
  isLast,
}: {
  item: { title?: string; link?: string; imageUrl?: string | null; pubDate: Date | string }
  isLast: boolean
}) {
  const { theme } = useThemeContext()

  const handlePress = () => {
    if (item.link) openExternalLink(item.link, { inApp: true })
  }

  return (
    <Pressable
      onPress={handlePress}
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border[theme].subtle,
        alignItems: 'center',
      }}
    >
      <Stack gap={4} flex={1} justify="center">
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.text[theme].primary,
            lineHeight: 19,
          }}
          numberOfLines={3}
        >
          {item.title}
        </Text>
      </Stack>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={{
            width: 72,
            height: 56,
            borderRadius: 8,
            backgroundColor: colors.bg[theme].muted,
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 72,
            height: 56,
            borderRadius: 8,
            backgroundColor: colors.bg[theme].muted,
          }}
        />
      )}
    </Pressable>
  )
}

export function CompactNewsWidget() {
  const { theme } = useThemeContext()
  const router = useRouter()

  const { effectiveIndustryId } = useNewsIndustryResolution({
    industrySlug: 'construction',
    useUserIndustry: true,
  })

  const { data: newsItems, isLoading } = useAggregatedNews({
    industryId: effectiveIndustryId ?? '',
    maxTotalItems: 3,
    enabled: !!effectiveIndustryId,
  })

  if (isLoading) {
    return (
      <DashboardWidget>
        <Row justify="space-between" align="center" paddingBottom={4}>
          <Text
            style={{ fontSize: 18, fontWeight: '700', color: colors.text[theme].primary }}
          >
            News
          </Text>
        </Row>
        <SkeletonGroup gap={0} animation="wave">
          {[1, 2, 3].map((i) => (
            <Row
              key={i}
              gap={12}
              style={{
                paddingVertical: 14,
                borderBottomWidth: i === 3 ? 0 : 1,
                borderBottomColor: colors.border[theme].subtle,
              }}
            >
              <Stack gap={4} flex={1}>
                <Skeleton width="90%" height={14} />
                <Skeleton width="70%" height={14} />
              </Stack>
              <Skeleton width={72} height={56} borderRadius={8} />
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
      <Row justify="space-between" align="center" paddingBottom={4}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.text[theme].primary,
          }}
        >
          News
        </Text>
        <Pressable
          onPress={() => router.push('/dashboard/news')}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.primary[600],
            }}
          >
            All news
          </Text>
        </Pressable>
      </Row>
      {items.map((item, i) => (
        <NewsItem
          key={`news-${i}-${(item as Record<string, unknown>).link ?? ''}`}
          item={item as never}
          isLast={i === items.length - 1}
        />
      ))}
    </DashboardWidget>
  )
}
