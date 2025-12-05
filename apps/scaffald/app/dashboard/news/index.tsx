import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import type { NewsItem } from '@scf/core/features/news'
import { useAggregatedNews } from '@scf/core/features/news/hooks/useNewsFeed'
import { redirect } from '@scf/core/utils/redirect'
import { supabase } from '@scf/core/utils/supabase/client'
import { AlertCircle, ExternalLink, RefreshCw } from '@tamagui/lucide-icons'
import { Button, NewsCard, spacing } from '@unicornlove/ui'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { Paragraph, Spinner, Text, XStack, YStack } from '@unicornlove/ui'

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
  const [industryId, setIndustryId] = useState<string>('')

  // Get industry ID from slug
  useEffect(() => {
    async function resolveIndustryId() {
      const { data: industryData } = await supabase
        .schema('core')
        .from('industries')
        .select('id')
        .eq('slug', DEFAULT_INDUSTRY)
        .single()

      if (industryData?.id) {
        setIndustryId(industryData.id)
      }
    }

    void resolveIndustryId()
  }, [])

  const {
    data: newsItems = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAggregatedNews({
    industryId,
    maxTotalItems: FULL_PAGE_ITEM_COUNT,
  })

  const handleOpenArticle = async (article: NewsItem) => {
    try {
      if (Platform.OS === 'web') {
        window.open(article.link, '_blank', 'noopener,noreferrer')
      } else {
        await WebBrowser.openBrowserAsync(article.link, {
          controlsColor: '#2563eb',
          dismissButtonStyle: 'close',
          enableBarCollapsing: true,
          toolbarColor: '#0f172a',
        })
      }
    } catch (browserError) {
      console.warn('Failed to open article, using redirect fallback:', browserError)
      redirect(article.link)
    }
  }

  const content = (
    <YStack gap="$4" paddingHorizontal={spacing.lg} paddingVertical={spacing.lg}>
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="700" color="$color12">
          Industry News
        </Text>
        <Paragraph size="$4" color="$color10">
          Curated headlines across construction, safety, technology, and workforce development.
        </Paragraph>
      </YStack>

      <XStack gap="$2">
        <Button
          size="$3"
          variant="outlined"
          icon={<RefreshCw size={16} />}
          onPress={() => {
            void refetch()
          }}
          disabled={isLoading}
        >
          Refresh
        </Button>
        <Button size="$3" variant="outlined" onPress={() => router.back()}>
          Back
        </Button>
      </XStack>

      {isLoading && newsItems.length === 0 ? (
        <YStack alignItems="center" gap="$3" paddingVertical="$8">
          <Spinner size="large" color="$blue7" />
          <Text color="$color11" fontSize="$5">
            Loading latest news…
          </Text>
        </YStack>
      ) : null}

      {isError ? (
        <YStack alignItems="center" gap="$3" paddingVertical="$8">
          <AlertCircle size={32} color="$red10" />
          <Text color="$red11" fontSize="$5" style={{ textAlign: 'center' }}>
            Unable to load news at the moment.
          </Text>
          <Text color="$color11" fontSize="$4" style={{ textAlign: 'center' }}>
            {error?.message || 'Please check your connection and try again.'}
          </Text>
          <Button
            variant="primary"
            size="$3"
            onPress={() => {
              void refetch()
            }}
          >
            Retry
          </Button>
        </YStack>
      ) : null}

      {!isLoading && !isError && newsItems.length === 0 ? (
        <YStack alignItems="center" gap="$3" paddingVertical="$8">
          <Text color="$color11" fontSize="$5" fontWeight="600">
            No articles found
          </Text>
          <Text color="$color10" fontSize="$4" style={{ textAlign: 'center' }}>
            Please check again soon for more industry updates.
          </Text>
        </YStack>
      ) : null}

      <YStack gap="$4">
        {newsItems.map((item: NewsItem) => (
          <NewsCard
            key={item.id}
            title={item.title}
            description={item.description}
            image={item.image}
            onPress={() => handleOpenArticle(item)}
            fullCardClickable
            minHeight={220}
            footer={
              <XStack gap="$3" alignItems="center">
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
  )

  return <DashboardPage showBreadcrumb={false} pageTitle="Industry News" leftContent={content} />
}
