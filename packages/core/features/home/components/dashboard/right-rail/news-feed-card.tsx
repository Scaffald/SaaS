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

type NewsArticle = {
  id: string
  title: string
  excerpt: string
  imageUrl?: string
  link: string
  publishedAt?: string
}

const ARTICLE_LIMIT = 5

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

const stripCdata = (input: string) => input.replace(/<!\[CDATA\[|\]\]>/g, '')

const decodeEntities = (value: string) =>
  value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")

const stripHtml = (input: string) =>
  decodeEntities(input.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()

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

const extractTag = (source: string, tag: string) => {
  const regex = new RegExp(`<${tag}>([\s\S]*?)</${tag}>`, 'i')
  const match = source.match(regex)
  return match ? stripCdata(match[1]).trim() : ''
}

const extractAttribute = (source: string, tag: string, attribute: string) => {
  const regex = new RegExp(`<${tag}[^>]*${attribute}="([^"]+)"[^>]*>`, 'i')
  const match = source.match(regex)
  return match ? match[1] : ''
}

const parseRssFeed = (xml: string): NewsArticle[] => {
  return xml
    .split('<item>')
    .slice(1)
    .map((chunk) => chunk.split('</item>')[0])
    .map((item) => {
      const title = decodeEntities(stripCdata(extractTag(item, 'title')))
      const link = extractTag(item, 'link')
      const guid = extractTag(item, 'guid')
      const description = extractTag(item, 'description')
      const imageUrl = extractAttribute(item, 'enclosure', 'url')
      const publishedAt = extractTag(item, 'pubDate')

      return {
        id: guid || link || title,
        title,
        link,
        excerpt: stripHtml(description),
        imageUrl: imageUrl || undefined,
        publishedAt: publishedAt || undefined,
      }
    })
    .filter((article) => article.title && article.link)
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
    const abortController =
      typeof AbortController !== 'undefined' ? new AbortController() : null
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

        const response = await fetch(endpoint, abortController ? { signal: abortController.signal } : undefined)

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`)
        }

        const text = await response.text()
        const parsed = parseRssFeed(text).slice(0, ARTICLE_LIMIT)

        if (abortController?.signal.aborted || !isActive) return

        startTransition(() => {
          setArticles(parsed)
        })
      } catch (err) {
        if (abortController?.signal.aborted || !isActive) return

        console.warn('News feed loading failed:', err)
        startTransition(() => {
          setArticles([])
        })
        setError('Unable to load news right now. Please try again later.')
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

      <YStack gap="$3">
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
          <YStack gap="$3">
            {articles.map((article) => {
              const formattedDate = formatPublishDate(article.publishedAt)
              return (
                <YStack key={article.id} gap="$2">
                  {article.imageUrl ? (
                    <Image
                      source={{ uri: article.imageUrl }}
                      contentFit="cover"
                      style={{ width: '100%', height: 120, borderRadius: 12 }}
                    />
                  ) : null}
                  <YStack gap="$1">
                    <XStack ai="center" justifyContent="space-between">
                      <SizableText size="$3" fontWeight="600" flex={1}>
                        {article.title}
                      </SizableText>
                      <Button
                        size="$2"
                        chromeless
                        iconAfter={ArrowRight}
                        onPress={() => openLink(article.link)}
                      >
                        Read
                      </Button>
                    </XStack>
                    {article.excerpt ? (
                      <Paragraph size="$2" color="$gray11">
                        {article.excerpt}
                      </Paragraph>
                    ) : null}
                    {formattedDate ? (
                      <Paragraph size="$1" color="$gray10">
                        {formattedDate}
                      </Paragraph>
                    ) : null}
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
