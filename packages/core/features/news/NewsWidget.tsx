import { useState } from 'react'
import { Text, YStack, XStack, Button, Spinner } from 'tamagui'
import { Select } from '@tamagui/select'
import { ChevronDown, RefreshCw, AlertCircle } from '@tamagui/lucide-icons'
import { NewsCard } from '@app/ui'
import { useAggregatedNews } from './hooks/useNewsFeed'
import { getFeedsByIndustry, getDefaultFeeds, findFeedById } from './config/news-feeds'
import type { NewsWidgetProps, NewsItem } from './config/types'

/**
 * NewsWidget - A comprehensive news widget for industry-specific feeds
 *
 * Features:
 * - Industry-specific RSS feed aggregation
 * - Feed selection dropdown
 * - Loading states and error handling
 * - Integration with existing NewsCard component
 * - Cross-platform compatibility
 */
export function NewsWidget({
  industry = 'construction',
  maxItems = 5,
  showFeedSelector = true,
  onArticleClick,
}: NewsWidgetProps) {
  const industryFeeds = getFeedsByIndustry(industry)
  const defaultFeeds = getDefaultFeeds(industry)
  const [selectedFeedIds, setSelectedFeedIds] = useState<string[]>(defaultFeeds)

  // Get URLs for selected feeds
  const selectedFeedUrls = selectedFeedIds
    .map((feedId) => findFeedById(industry, feedId)?.url)
    .filter(Boolean) as string[]

  const {
    data: newsItems = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAggregatedNews(selectedFeedUrls, maxItems)

  const handleFeedChange = (feedId: string) => {
    setSelectedFeedIds([feedId])
  }

  const handleRefresh = () => {
    refetch()
  }

  const handleNewsClick = (article: NewsItem) => {
    if (onArticleClick) {
      onArticleClick(article)
    } else {
      // Default behavior - open in new tab/window
      if (typeof window !== 'undefined') {
        window.open(article.link, '_blank')
      }
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'safety':
        return '$red8'
      case 'technology':
        return '$blue8'
      case 'sustainability':
        return '$green8'
      case 'finance':
        return '$orange8'
      case 'workforce':
        return '$purple8'
      case 'equipment':
        return '$yellow8'
      default:
        return '$gray8'
    }
  }

  const getCategoryName = (category?: string) => {
    if (!category) return 'General'
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  return (
    <YStack gap="$4">
      {/* Header with title and controls */}
      <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$6" pt="$6">
        <Text fontSize="$6" fontWeight="600">
          News
        </Text>

        <XStack gap="$2" alignItems="center">
          {/* Feed Selector */}
          {showFeedSelector && (
            <Select value={selectedFeedIds[0] || ''} onValueChange={handleFeedChange} size="$3">
              <Select.Trigger width={140} iconAfter={ChevronDown}>
                <Select.Value placeholder="Select feed" />
              </Select.Trigger>

              <Select.Content zIndex={200000}>
                <Select.ScrollUpButton
                  alignItems="center"
                  justifyContent="center"
                  position="relative"
                  width="100%"
                  height="$3"
                >
                  <YStack zIndex={10}>
                    <ChevronDown size={20} />
                  </YStack>
                </Select.ScrollUpButton>

                <Select.Viewport minWidth={200}>
                  {/* National Feeds */}
                  <Select.Group>
                    <Select.Label>National</Select.Label>
                    {industryFeeds.national.map((feed, index) => (
                      <Select.Item key={feed.id} index={index} value={feed.id}>
                        <Select.ItemText>{feed.name}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Group>

                  {/* Regional Feeds */}
                  {industryFeeds.regional.length > 0 && (
                    <Select.Group>
                      <Select.Label>Regional</Select.Label>
                      {industryFeeds.regional.slice(0, 5).map((feed, index) => (
                        <Select.Item
                          key={feed.id}
                          index={index + industryFeeds.national.length}
                          value={feed.id}
                        >
                          <Select.ItemText>{feed.name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Group>
                  )}

                  {/* Topical Feeds */}
                  {industryFeeds.topical.length > 0 && (
                    <Select.Group>
                      <Select.Label>Topics</Select.Label>
                      {industryFeeds.topical.slice(0, 8).map((feed, index) => (
                        <Select.Item
                          key={feed.id}
                          index={
                            index +
                            industryFeeds.national.length +
                            Math.min(industryFeeds.regional.length, 5)
                          }
                          value={feed.id}
                        >
                          <Select.ItemText>{feed.name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Group>
                  )}
                </Select.Viewport>

                <Select.ScrollDownButton
                  alignItems="center"
                  justifyContent="center"
                  position="relative"
                  width="100%"
                  height="$3"
                >
                  <YStack zIndex={10}>
                    <ChevronDown size={20} />
                  </YStack>
                </Select.ScrollDownButton>
              </Select.Content>
            </Select>
          )}

          {/* Refresh Button */}
          <Button
            size="$3"
            variant="outlined"
            onPress={handleRefresh}
            disabled={isLoading}
            icon={isLoading ? <Spinner size="small" /> : <RefreshCw size={16} />}
          />
        </XStack>
      </XStack>

      {/* News Content */}
      <YStack gap="$3">
        {/* Loading State */}
        {isLoading && newsItems.length === 0 && (
          <YStack alignItems="center" padding="$6" gap="$3">
            <Spinner size="large" />
            <Text color="$color11" fontSize="$4">
              Loading news...
            </Text>
          </YStack>
        )}

        {/* Error State */}
        {isError && (
          <YStack alignItems="center" padding="$6" gap="$3">
            <AlertCircle size={24} color="$red10" />
            <Text color="$red11" fontSize="$4" textAlign="center">
              Failed to load news feed
            </Text>
            <Text color="$color11" fontSize="$3" textAlign="center">
              {error?.message || 'Please check your internet connection'}
            </Text>
            <Button onPress={handleRefresh} size="$3">
              Try Again
            </Button>
          </YStack>
        )}

        {/* News Items */}
        {newsItems.length > 0 && (
          <>
            {newsItems.map((item) => (
              <NewsCard
                key={item.id}
                title={item.title}
                description={item.description}
                image={item.image}
                onPress={() => handleNewsClick(item)}
                fullCardClickable
                minHeight={200}
                header={
                  item.category ? (
                    <Button
                      size="$2"
                      backgroundColor={getCategoryColor(item.category)}
                      color="white"
                      borderRadius="$10"
                    >
                      {getCategoryName(item.category)}
                    </Button>
                  ) : undefined
                }
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
                  </XStack>
                }
              />
            ))}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !isError && newsItems.length === 0 && (
          <YStack alignItems="center" padding="$6" gap="$3">
            <Text color="$color11" fontSize="$4">
              No news available
            </Text>
            <Text color="$color10" fontSize="$3" textAlign="center">
              Try selecting a different feed or check back later
            </Text>
          </YStack>
        )}
      </YStack>
    </YStack>
  )
}
