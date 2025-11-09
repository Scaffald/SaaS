import { useMemo } from 'react'
import { Platform } from 'react-native'
import { YStack, Text, ScrollView, Spinner, Paragraph, XStack } from 'tamagui'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { AlertCircle, RefreshCw, ExternalLink } from '@tamagui/lucide-icons'

import { NewsCard, UIButton as StyledButton, spacing } from '@app/ui'
import { useAggregatedNews } from '@app/core/features/news/hooks/useNewsFeed'
import { getDefaultFeeds, findFeedById } from '@app/core/features/news/config/news-feeds'
import { redirect } from '@app/core/utils/redirect'
import type { NewsItem } from '@app/core/features/news'

const FULL_PAGE_ITEM_COUNT = 40
const DEFAULT_INDUSTRY = 'construction'

const formatTimeAgo = (date: Date) => {
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

export default function NewsPage() {
  const router = useRouter()

  const defaultFeedIds = useMemo(() => getDefaultFeeds(DEFAULT_INDUSTRY), [])
  const selectedFeedUrls = useMemo(
    () =>
      defaultFeedIds
        .map((feedId) => findFeedById(DEFAULT_INDUSTRY, feedId)?.url)
        .filter((url): url is string => Boolean(url)),
    [defaultFeedIds]
  )

  const {
    data: newsItems = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAggregatedNews(selectedFeedUrls, FULL_PAGE_ITEM_COUNT)

  const handleOpenArticle = async (article: NewsItem) => {
    try {
      if (Platform.OS === 'web') {
        window.open(article.link, '_blank', 'noopener,noreferrer')
      } else {
        await WebBrowser.openBrowserAsync(article.link, {
          enableBarCollapsing: true,
          dismissButtonStyle: 'close',
          toolbarColor: '#0f172a',
          controlsColor: '#2563eb',
        })
      }
    } catch (browserError) {
      console.warn('Failed to open article, using redirect fallback:', browserError)
      redirect(article.link)
    }
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$4" px={spacing.lg} py={spacing.lg}>
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="700" color="$color12">
            Industry News
          </Text>
          <Paragraph size="$4" color="$color10">
            Curated headlines across construction, safety, technology, and workforce development.
          </Paragraph>
        </YStack>

        <XStack gap="$2">
          <StyledButton
            size="$3"
            variant="outlined"
            icon={<RefreshCw size={16} />}
            onPress={() => {
              void refetch()
            }}
            disabled={isLoading}
          >
            Refresh
          </StyledButton>
          <StyledButton size="$3" variant="outlined" onPress={() => router.back()}>
            Back
          </StyledButton>
        </XStack>

        {isLoading && newsItems.length === 0 ? (
          <YStack items="center" gap="$3" py="$8">
            <Spinner size="large" color="$blue7" />
            <Text color="$color11" fontSize="$5">
              Loading latest news…
            </Text>
          </YStack>
        ) : null}

        {isError ? (
          <YStack items="center" gap="$3" py="$8">
            <AlertCircle size={32} color="$red10" />
            <Text color="$red11" fontSize="$5" style={{ textAlign: 'center' }}>
              Unable to load news at the moment.
            </Text>
            <Text color="$color11" fontSize="$4" style={{ textAlign: 'center' }}>
              {error?.message || 'Please check your connection and try again.'}
            </Text>
            <StyledButton
              variant="primary"
              size="$3"
              onPress={() => {
                void refetch()
              }}
            >
              Retry
            </StyledButton>
          </YStack>
        ) : null}

        {!isLoading && !isError && newsItems.length === 0 ? (
          <YStack items="center" gap="$3" py="$8">
            <Text color="$color11" fontSize="$5" fontWeight="600">
              No articles found
            </Text>
            <Text color="$color10" fontSize="$4" style={{ textAlign: 'center' }}>
              Please check again soon for more industry updates.
            </Text>
          </YStack>
        ) : null}

        <YStack gap="$4">
          {newsItems.map((item) => (
            <NewsCard
              key={item.id}
              title={item.title}
              description={item.description}
              image={item.image}
              onPress={() => handleOpenArticle(item)}
              fullCardClickable
              minH={220}
              footer={
                <XStack gap="$3" items="center">
                  <Text fontSize="$2" color="$color11">
                    {formatTimeAgo(item.pubDate)}
                  </Text>
                  {item.readTime && (
                    <>
                      <Text fontSize="$2" color="$color11">
                        •
                      </Text>
                      <Text fontSize="$2" color="$color11">
                        {item.readTime}
                      </Text>
                    </>
                  )}
                  {item.author && (
                    <>
                      <Text fontSize="$2" color="$color11">
                        •
                      </Text>
                      <Text fontSize="$2" color="$color11">
                        {item.author}
                      </Text>
                    </>
                  )}
                  <ExternalLink size={16} color="$color11" />
                </XStack>
              }
            />
          ))}
        </YStack>
      </YStack>
    </ScrollView>
  )
}
