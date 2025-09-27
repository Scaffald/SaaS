import { startTransition, useEffect, useMemo, useState } from 'react'
import { Linking } from 'react-native'

import {
  Adapt,
  Button,
  Image,
  Paragraph,
  Select,
  SizableText,
  XStack,
  YStack,
  isWeb,
  useDidFinishSSR,
} from '@app/ui'
import { ArrowRight, Check, ChevronDown } from '@tamagui/lucide-icons'
import { Sheet } from 'tamagui'

import { DashboardCard, SectionHeading } from '../primitives'
import {
  DEFAULT_NEWS_SOURCE_ID,
  NEWS_SOURCES,
  NEWS_SOURCE_LOOKUP,
  type NewsSource,
} from './news-sources'
import { createFallbackArticles, type NewsArticle, parseRssFeed } from './news-parser'

const ARTICLE_LIMIT = 3

// Loading skeleton component
const NewsLoadingSkeleton = () => (
  <YStack gap="$3">
    {Array.from({ length: 3 }).map((_, i) => (
      <YStack key={i} gap="$2">
        <YStack h={16} bg="$gray4" br="$2" w="85%" />
        <YStack h={12} bg="$gray3" br="$2" w="100%" />
        <YStack h={10} bg="$gray3" br="$2" w="60%" />
      </YStack>
    ))}
  </YStack>
)

const formatPublishDate = (value?: string) => {
  if (!value) return undefined
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return undefined
  try {
    return parsed.toLocaleDateString()
  } catch {
    return undefined
  }
}

const openLink = (url?: string) => {
  if (!url) return

  if (isWeb) {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  } else {
    Linking.openURL(url).catch(() => {
      // no-op if we fail to open the link
    })
  }
}

export const NewsFeedCard = () => {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(DEFAULT_NEWS_SOURCE_ID)
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const isHydrated = useDidFinishSSR()

  const selectedSource = useMemo<NewsSource | undefined>(
    () =>
      NEWS_SOURCE_LOOKUP[selectedSourceId] ??
      (DEFAULT_NEWS_SOURCE_ID ? NEWS_SOURCE_LOOKUP[DEFAULT_NEWS_SOURCE_ID] : undefined),
    [selectedSourceId]
  )

  useEffect(() => {
    if (!isHydrated || !selectedSource) return

    let isActive = true
    const abortController = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timeoutId = abortController
      ? setTimeout(() => {
          abortController.abort()
        }, 10000)
      : null

    setIsLoading(true)
    setError(null)
    startTransition(() => {
      setArticles([])
    })

    const loadArticles = async () => {
      try {
        const endpoint = isWeb
          ? `/api/news?source=${encodeURIComponent(selectedSource.id)}`
          : selectedSource.feedUrl

        const response = await fetch(
          endpoint,
          abortController ? { signal: abortController.signal } : undefined
        )

        let parsed: NewsArticle[] = []
        if (isWeb) {
          const payload = (await response.json().catch(() => ({ articles: [] }))) as {
            articles?: NewsArticle[]
            error?: string
          }

          if (!response.ok) {
            throw new Error(payload?.error || `Request failed: ${response.status}`)
          }

          parsed = Array.isArray(payload?.articles) ? payload.articles : []
        } else {
          const text = await response.text()

          if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`)
          }

          parsed = parseRssFeed(text)
        }

        const limitedArticles = parsed.slice(0, ARTICLE_LIMIT)

        if (abortController?.signal.aborted || !isActive) return

        startTransition(() => {
          setArticles(limitedArticles)
        })
      } catch (err) {
        if (abortController?.signal.aborted || !isActive) return

        console.warn('News feed loading failed:', err)
        const fallbackArticles =
          process.env.NODE_ENV !== 'production' ? createFallbackArticles(selectedSource) : []

        startTransition(() => {
          setArticles(fallbackArticles)
        })

        setError(
          fallbackArticles.length === 0
            ? 'Unable to load news right now. Please try again later.'
            : null
        )
      } finally {
        if (abortController?.signal.aborted || !isActive) return
        setIsLoading(false)
      }
    }

    void loadArticles()

    return () => {
      isActive = false
      if (timeoutId) clearTimeout(timeoutId)
      abortController?.abort()
    }
  }, [selectedSource, isHydrated, refreshCounter])

  return (
    <DashboardCard gap="$4">
      <SectionHeading
        title="News"
        action={
          <Button
            chromeless
            size="$2"
            iconAfter={ArrowRight}
            onPress={() => {
              if (articles.length > 0) {
                openLink(articles[0].link)
              } else {
                openLink(selectedSource?.siteUrl)
              }
            }}
          >
            View more
          </Button>
        }
      />

      <YStack gap="$4">
        <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
          <Select.Trigger minWidth="100%" iconAfter={ChevronDown}>
            <Select.Value placeholder="Choose a news source" />
          </Select.Trigger>
          {isHydrated ? (
            <Adapt when="sm" platform="touch">
              <Sheet animation="medium" dismissOnSnapToBottom modal snapPointsMode="fit">
                <Sheet.Frame marginBottom="$4">
                  <Sheet.ScrollView>
                    <Adapt.Contents />
                  </Sheet.ScrollView>
                </Sheet.Frame>
                <Sheet.Overlay
                  animation="lazy"
                  enterStyle={{ opacity: 0 }}
                  exitStyle={{ opacity: 0 }}
                />
              </Sheet>
            </Adapt>
          ) : null}
          <Select.Content>
            <Select.Viewport minWidth={220}>
              {NEWS_SOURCES.map((source, index) => (
                <Select.Item key={source.id} index={index} value={source.id}>
                  <Select.ItemText>{source.label}</Select.ItemText>
                  <Select.ItemIndicator marginLeft="auto">
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select>

        {isLoading && articles.length === 0 ? (
          <NewsLoadingSkeleton />
        ) : error ? (
          <YStack gap="$2">
            <Paragraph size="$2" color="$red10">
              {error}
            </Paragraph>
            <Button
              size="$2"
              onPress={() => {
                setRefreshCounter((value) => value + 1)
              }}
            >
              Retry
            </Button>
          </YStack>
        ) : articles.length > 0 ? (
          <YStack gap="$4">
            {articles.map((article) => {
              const formattedDate = formatPublishDate(article.publishedAt)
              return (
                <YStack
                  key={article.id}
                  borderWidth={1}
                  borderColor="$gray6"
                  bg="$gray2"
                  br="$6"
                  overflow="hidden"
                  shadowColor="rgba(15, 23, 42, 0.08)"
                  shadowOffset={{ width: 0, height: 12 }}
                  shadowOpacity={1}
                  shadowRadius={24}
                >
                  {article.imageUrl ? (
                    <Image
                      source={{ uri: article.imageUrl }}
                      resizeMode="cover"
                      style={{ width: '100%', height: 160 }}
                    />
                  ) : null}
                  <YStack gap="$3" p="$4">
                    {selectedSource?.label ? (
                      <Paragraph
                        size="$1"
                        textTransform="uppercase"
                        letterSpacing={1}
                        color="$gray12"
                        bg="$gray4"
                        px="$3"
                        py="$1"
                        br="$5"
                        alignSelf="flex-start"
                      >
                        {selectedSource.label}
                      </Paragraph>
                    ) : null}
                    <YStack gap="$2">
                      <SizableText size="$5" fontWeight="700" lineHeight={24}>
                        {article.title}
                      </SizableText>
                      {article.excerpt ? (
                        <Paragraph size="$2" color="$gray11" numberOfLines={3}>
                          {article.excerpt}
                        </Paragraph>
                      ) : null}
                    </YStack>
                    <XStack ai="center" jc="space-between">
                      <YStack gap="$1">
                        <SizableText size="$2" color="$gray11" fontWeight="600">
                          {selectedSource?.label ?? 'Top Story'}
                        </SizableText>
                        {formattedDate ? (
                          <Paragraph size="$1" color="$gray10">
                            {formattedDate}
                          </Paragraph>
                        ) : null}
                      </YStack>
                      <Button
                        size="$2"
                        iconAfter={ArrowRight}
                        onPress={() => openLink(article.link)}
                      >
                        Read
                      </Button>
                    </XStack>
                  </YStack>
                </YStack>
              )
            })}
          </YStack>
        ) : (
          <NewsLoadingSkeleton />
        )}
      </YStack>
    </DashboardCard>
  )
}
