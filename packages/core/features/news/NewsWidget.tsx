import { api } from '@app/core/utils/api'
import { redirect } from '@app/core/utils/redirect'
import { supabase } from '@app/core/utils/supabase/client'
import { Sheet, UIButton as StyledButton, spacing } from '@app/ui'
import { AlertCircle, ExternalLink, RefreshCw } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useMemo, useState } from 'react'
import { Platform, Pressable } from 'react-native'
import { Paragraph, Spinner, Switch, Text, XStack, YStack } from 'tamagui'
import type { NewsItem, NewsWidgetProps } from './config/types'
import { useAggregatedNews } from './hooks/useNewsFeed'

const HEADLINE_LIMIT_DEFAULT = 10
const FETCH_MULTIPLIER = 4
const RECENT_CUTOFF_HOURS = 48

type NewsPreferences = {
  prioritizeTrending: boolean
  matchSkills: boolean
  matchIndustry: boolean
  recentOnly: boolean
}

type EnrichedNewsItem = NewsItem & {
  relevanceScore: number
  reasons: string[]
  hoursSincePublished: number
}

interface RelevanceContext {
  skillKeywords: string[]
  industryKeyword: string | null
  occupationKeyword: string | null
}

const sanitize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const getHoursSince = (date: Date | string) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to getHoursSince:', date)
    return 0
  }
  const diffMs = Date.now() - dateObj.getTime()
  return diffMs / (1000 * 60 * 60)
}

const formatTimeAgo = (date: Date | string) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  const hours = Math.floor(getHoursSince(dateObj))
  const days = Math.floor(hours / 24)

  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  return dateObj.toLocaleDateString()
}

const capitalise = (value?: string | null) => {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function computeRelevance(
  article: NewsItem,
  context: RelevanceContext,
  preferences: NewsPreferences
): { score: number; reasons: string[]; hoursSincePublished: number } {
  const articleText = sanitize(`${article.title ?? ''} ${article.description ?? ''}`)

  let score = preferences.prioritizeTrending ? 5 : 3
  const reasons: string[] = []

  if (preferences.matchSkills && context.skillKeywords.length > 0) {
    const matches = context.skillKeywords.filter(
      (keyword) => keyword.length > 2 && articleText.includes(keyword)
    )
    if (matches.length > 0) {
      score += 4 + Math.min(matches.length, 3)
      reasons.push(matches.length > 1 ? 'Matches multiple skills' : 'Matches your skills')
    }
  }

  if (preferences.matchIndustry && context.industryKeyword) {
    if (articleText.includes(context.industryKeyword)) {
      score += 3
      reasons.push('Relevant to your industry')
    }
  }

  if (context.occupationKeyword && articleText.includes(context.occupationKeyword)) {
    score += 2
    reasons.push('Matches your role')
  }

  const hoursSincePublished = getHoursSince(article.pubDate)
  if (preferences.recentOnly && hoursSincePublished > RECENT_CUTOFF_HOURS) {
    score -= 5
  }

  if (hoursSincePublished < 6) {
    score += 2
    reasons.push('Fresh update')
  } else if (hoursSincePublished < 24) {
    score += 1
    reasons.push('Published today')
  }

  if (article.category) {
    score += 0.5
  }

  return {
    score,
    reasons: Array.from(new Set(reasons)),
    hoursSincePublished,
  }
}

export function NewsWidget({
  industry = 'construction',
  maxItems = HEADLINE_LIMIT_DEFAULT,
  onArticleClick,
}: NewsWidgetProps) {
  const router = useRouter()
  const headlineLimit = Math.max(1, maxItems)
  const fetchCount = headlineLimit * FETCH_MULTIPLIER

  const { data: user } = api.profile.useUser.useQuery()
  const userId = user?.id

  const { data: generalInfo } = api.profile.widgets.getGeneralInfo.useQuery(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

  // Get industry ID from user profile or lookup by slug
  const [industryId, setIndustryId] = useState<string | null>(null)
  // Construction industry ID for fallback news
  const [constructionIndustryId, setConstructionIndustryId] = useState<string | null>(null)

  useEffect(() => {
    async function resolveIndustryId() {
      // First try to get from user's profile
      if (generalInfo?.industries?.id) {
        setIndustryId(generalInfo.industries.id)
        return
      }

      // Fallback: lookup industry by slug (from prop or default to 'construction')
      const industrySlug = industry || 'construction'
      const { data: industryData } = await supabase
        .schema('core')
        .from('industries')
        .select('id')
        .eq('slug', industrySlug)
        .single()

      if (industryData?.id) {
        setIndustryId(industryData.id)
      } else {
        // Final fallback: try to get construction industry
        const { data: fallbackData } = await supabase
          .schema('core')
          .from('industries')
          .select('id')
          .eq('slug', 'construction')
          .single()

        setIndustryId(fallbackData?.id || null)
      }
    }

    void resolveIndustryId()
  }, [generalInfo?.industries?.id, industry])

  // Resolve construction industry ID for fallback news
  useEffect(() => {
    async function resolveConstructionIndustryId() {
      const { data: constructionData } = await supabase
        .schema('core')
        .from('industries')
        .select('id')
        .eq('slug', 'construction')
        .single()

      if (constructionData?.id) {
        setConstructionIndustryId(constructionData.id)
      }
    }

    void resolveConstructionIndustryId()
  }, [])

  const {
    data: newsItems = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAggregatedNews({
    industryId: industryId || '', // Will be validated in hook - query disabled if invalid
    maxTotalItems: fetchCount,
  })

  // Fallback query for global ENR news when no matching news is found
  // Only fetch fallback if main query is done, no error, and construction industry ID is available
  // We'll check enrichedNews length after it's computed to determine if we need fallback
  const { data: fallbackNewsItems = [], isLoading: isFallbackLoading } = useAggregatedNews({
    industryId: constructionIndustryId || '', // Construction industry for global ENR news
    maxTotalItems: headlineLimit,
    enabled: !isLoading && !isError && !!constructionIndustryId, // Fetch fallback when main query is done
  })

  const [preferences, setPreferences] = useState<NewsPreferences>({
    prioritizeTrending: true,
    matchSkills: true,
    matchIndustry: true,
    recentOnly: false,
  })
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  const { data: userSkills } = api.profile.widgets.getSkills.useQuery(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

  const skillKeywords = useMemo(() => {
    if (!userSkills) return [] as string[]
    const keywords = new Set<string>()
    for (const skill of userSkills as Array<Record<string, unknown>>) {
      const label =
        typeof skill.label === 'string'
          ? sanitize(skill.label)
          : typeof skill.name === 'string'
            ? sanitize(skill.name)
            : null
      if (label && label.length > 2) {
        keywords.add(label)
      }
      const displayCode = typeof skill.displayCode === 'string' ? sanitize(skill.displayCode) : null
      if (displayCode && displayCode.length > 1) {
        keywords.add(displayCode)
      }
    }
    return Array.from(keywords).slice(0, 20)
  }, [userSkills])

  const industryKeyword = useMemo(() => {
    const industryFromRelation =
      typeof generalInfo?.industries === 'object' &&
      generalInfo?.industries !== null &&
      'name' in generalInfo.industries &&
      typeof (generalInfo.industries as { name?: unknown }).name === 'string'
        ? (generalInfo.industries as { name?: string }).name
        : null

    const fallbackIndustry =
      typeof generalInfo?.industry_name === 'string' ? generalInfo.industry_name : null

    const resolved = industryFromRelation ?? fallbackIndustry

    return resolved ? sanitize(resolved) : null
  }, [generalInfo])

  const occupationKeyword = useMemo(() => {
    if (generalInfo?.headline) {
      return sanitize(generalInfo.headline)
    }
    return null
  }, [generalInfo])

  const relevanceContext = useMemo<RelevanceContext>(
    () => ({
      skillKeywords,
      industryKeyword,
      occupationKeyword,
    }),
    [skillKeywords, industryKeyword, occupationKeyword]
  )

  const enrichedNews = useMemo(() => {
    if (!newsItems.length) return [] as EnrichedNewsItem[]

    const scored = newsItems.map((item: NewsItem) => {
      const { score, reasons, hoursSincePublished } = computeRelevance(
        item,
        relevanceContext,
        preferences
      )
      return {
        ...item,
        relevanceScore: score,
        reasons,
        hoursSincePublished,
      }
    })

    const filtered = preferences.recentOnly
      ? scored.filter((item: EnrichedNewsItem) => item.hoursSincePublished <= RECENT_CUTOFF_HOURS)
      : scored

    const sorted = filtered
      .sort((a: EnrichedNewsItem, b: EnrichedNewsItem) => {
        if (b.relevanceScore === a.relevanceScore) {
          // Ensure pubDate is a Date object
          const dateA = a.pubDate instanceof Date ? a.pubDate : new Date(a.pubDate)
          const dateB = b.pubDate instanceof Date ? b.pubDate : new Date(b.pubDate)
          return dateB.getTime() - dateA.getTime()
        }
        return b.relevanceScore - a.relevanceScore
      })
      .slice(0, headlineLimit)

    if (sorted.length >= headlineLimit) {
      return sorted
    }

    const fallback = newsItems
      .filter(
        (item: NewsItem) => !sorted.some((existing: EnrichedNewsItem) => existing.id === item.id)
      )
      .sort((a: NewsItem, b: NewsItem) => {
        // Ensure pubDate is a Date object
        const dateA = a.pubDate instanceof Date ? a.pubDate : new Date(a.pubDate)
        const dateB = b.pubDate instanceof Date ? b.pubDate : new Date(b.pubDate)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, headlineLimit - sorted.length)
      .map((item: NewsItem) => ({
        ...item,
        relevanceScore: 0,
        reasons: [],
        hoursSincePublished: getHoursSince(item.pubDate),
      }))

    return [...sorted, ...fallback]
  }, [headlineLimit, newsItems, preferences, relevanceContext])

  // Use fallback news (global ENR) when no matching news is found
  const fallbackEnrichedNews = useMemo(() => {
    if (!fallbackNewsItems.length) return [] as EnrichedNewsItem[]

    // For fallback, just sort by date (no relevance scoring needed)
    return fallbackNewsItems
      .sort((a: NewsItem, b: NewsItem) => {
        const dateA = a.pubDate instanceof Date ? a.pubDate : new Date(a.pubDate)
        const dateB = b.pubDate instanceof Date ? b.pubDate : new Date(b.pubDate)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, headlineLimit)
      .map((item: NewsItem) => ({
        ...item,
        relevanceScore: 0,
        reasons: [],
        hoursSincePublished: getHoursSince(item.pubDate),
      }))
  }, [fallbackNewsItems, headlineLimit])

  // Determine which news to display: enriched news if available, otherwise fallback
  const displayNews = useMemo(() => {
    // If we have enriched news, use it
    if (enrichedNews.length > 0) {
      return enrichedNews
    }
    // Otherwise, use fallback news (global ENR)
    return fallbackEnrichedNews
  }, [enrichedNews, fallbackEnrichedNews])

  // Hide widget entirely if no news is available (after loading completes)
  const shouldShowWidget = useMemo(() => {
    // Show widget if we're still loading (either main or fallback)
    if (isLoading || isFallbackLoading) {
      return true
    }
    // Show widget if there's an error (so user can see error message)
    if (isError) {
      return true
    }
    // Hide widget if no news is available
    return displayNews.length > 0
  }, [isLoading, isFallbackLoading, isError, displayNews.length])

  const handleNewsClick = async (article: NewsItem) => {
    if (onArticleClick) {
      onArticleClick(article)
      return
    }

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
      console.warn('Failed to open article in web browser, redirecting:', browserError)
      redirect(article.link)
    }
  }

  const handleViewAll = () => {
    router.push('/dashboard/news')
  }

  const updatePreference = (key: keyof NewsPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const relevanceLabel = (score: number) => {
    if (score >= 10) return 'High relevance'
    if (score >= 7) return 'Relevant'
    if (score >= 4) return 'General interest'
    return 'From your feeds'
  }

  // Hide widget entirely if no news is available
  if (!shouldShowWidget) {
    return null
  }

  return (
    <YStack gap={spacing.md}>
      <XStack justify="space-between" items="center" pt={spacing.sm}>
        <Text fontSize="$6" fontWeight="600" color="$color12">
          News
        </Text>

        <XStack gap={spacing.xs} items="center">
          {/* TODO: Implement and refine filter button functionality later */}
          {/* <StyledButton
            size="$3"
            variant="outlined"
            icon={<Settings2 size={16} />}
            onPress={() => setPreferencesOpen(true)}
          /> */}
          <StyledButton
            size="$3"
            variant="outlined"
            onPress={() => {
              void refetch()
            }}
            disabled={isLoading}
            icon={isLoading ? <Spinner size="small" /> : <RefreshCw size={16} />}
          />
        </XStack>
      </XStack>

      {isLoading && displayNews.length === 0 && !isFallbackLoading ? (
        <YStack items="center" gap={spacing.sm}>
          <Spinner size="large" color="$blue7" />
          <Text color="$color11" fontSize="$4">
            Loading personalised news...
          </Text>
        </YStack>
      ) : null}

      {isError && displayNews.length === 0 ? (
        <YStack items="center" gap={spacing.sm}>
          <AlertCircle size={24} color="$red10" />
          <Text color="$red11" fontSize="$4" style={{ textAlign: 'center' }}>
            Failed to load news feed
          </Text>
          <Text color="$color11" fontSize="$3" style={{ textAlign: 'center' }}>
            {error?.message || 'Please check your connection and try again.'}
          </Text>
          <StyledButton
            variant="primary"
            onPress={() => {
              void refetch()
            }}
            size="$3"
          >
            Try Again
          </StyledButton>
        </YStack>
      ) : null}

      {displayNews.length > 0 && (
        <YStack gap="$3">
          {displayNews.map((item: EnrichedNewsItem) => (
            <Pressable key={item.id} onPress={() => handleNewsClick(item)}>
              {({ pressed }) => (
                <YStack
                  gap="$2"
                  p="$3"
                  bg="$color2"
                  borderWidth={1}
                  borderColor="$color4"
                  opacity={pressed ? 0.7 : 1}
                  style={{ borderRadius: 12 }}
                >
                  <XStack justify="space-between" items="flex-start" gap="$3">
                    <Text
                      fontSize="$4"
                      fontWeight="600"
                      color="$color12"
                      flex={1}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <ExternalLink size={16} color="$color10" />
                  </XStack>
                  <XStack gap="$2" items="center" flexWrap="wrap">
                    <Text fontSize="$2" color="$color11">
                      {formatTimeAgo(item.pubDate)}
                    </Text>
                    {item.category && (
                      <Text fontSize="$2" color="$color10">
                        • {capitalise(item.category)}
                      </Text>
                    )}
                    <Text fontSize="$2" color="$color10">
                      • {relevanceLabel(item.relevanceScore)}
                    </Text>
                  </XStack>
                  {item.reasons.length > 0 && (
                    <XStack gap="$2" flexWrap="wrap">
                      {item.reasons.slice(0, 2).map((reason: string, index: number) => (
                        <YStack
                          key={`${item.id}-reason-${index}`}
                          px="$2"
                          py="$1"
                          bg="$blue3"
                          style={{ borderRadius: 8 }}
                        >
                          <Text fontSize="$1" color="$blue11">
                            {reason}
                          </Text>
                        </YStack>
                      ))}
                    </XStack>
                  )}
                </YStack>
              )}
            </Pressable>
          ))}

          <StyledButton
            size="$3"
            variant="outlined"
            onPress={handleViewAll}
            iconAfter={<ExternalLink size={16} />}
          >
            View All News
          </StyledButton>
        </YStack>
      )}

      <Sheet
        modal
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
        snapPoints={[60]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Sheet.Frame p="$4" gap="$3">
          <Sheet.Handle />
          <Text fontSize="$5" fontWeight="600">
            Customise Recommendations
          </Text>
          <Paragraph color="$color11" size="$3">
            Tailor the news feed using your profile information.
          </Paragraph>

          <YStack gap="$3">
            <XStack justify="space-between" items="center">
              <Paragraph size="$3">Match my skills</Paragraph>
              <Switch
                size="$2"
                checked={preferences.matchSkills}
                onCheckedChange={(value) => updatePreference('matchSkills', value)}
              />
            </XStack>

            <XStack justify="space-between" items="center">
              <Paragraph size="$3">Match my industry</Paragraph>
              <Switch
                size="$2"
                checked={preferences.matchIndustry}
                onCheckedChange={(value) => updatePreference('matchIndustry', value)}
              />
            </XStack>

            <XStack justify="space-between" items="center">
              <Paragraph size="$3">Boost trending stories</Paragraph>
              <Switch
                size="$2"
                checked={preferences.prioritizeTrending}
                onCheckedChange={(value) => updatePreference('prioritizeTrending', value)}
              />
            </XStack>

            <XStack justify="space-between" items="center">
              <Paragraph size="$3">Show recent stories only</Paragraph>
              <Switch
                size="$2"
                checked={preferences.recentOnly}
                onCheckedChange={(value) => updatePreference('recentOnly', value)}
              />
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  )
}
