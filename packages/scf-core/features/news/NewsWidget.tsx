import { ROUTES } from '@scf/core/constants/routes'
import { useCurrentUser } from '@scf/core/utils/profile-general-sdk-hooks'
import { useGeneralInfoWidget, useSkillsWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { redirect } from '@scf/core/utils/redirect'
import {
  Button,
  DashboardWidgetHeader,
  Paragraph,
  Row,
  Sheet,
  SheetContent,
  SheetHeader,
  Spinner,
  Stack,
  Switch,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { AlertCircle, RefreshCw } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useMemo, useState } from 'react'
import { Image, Platform, Pressable } from 'react-native'
import type { NewsItem, NewsWidgetProps } from './config/types'
import { useAggregatedNews } from './hooks/useNewsFeed'
import { useNewsIndustryResolution } from './hooks/useNewsIndustryResolution'

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

  const {
    industryId: primaryIndustryId,
    constructionId,
    isResolving: isResolvingIndustry,
    effectiveIndustryId,
  } = useNewsIndustryResolution({
    industrySlug: industry,
    useUserIndustry: true,
  })

  const {
    data: newsItems = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAggregatedNews({
    industryId: effectiveIndustryId ?? '',
    maxTotalItems: fetchCount,
    enabled: !!effectiveIndustryId,
  })

  // Fallback: when primary industry returns no articles, try construction industry
  const shouldFetchFallback =
    !!constructionId &&
    constructionId !== primaryIndustryId &&
    constructionId !== effectiveIndustryId &&
    !isLoading &&
    (newsItems as unknown[]).length === 0

  const {
    data: fallbackNewsItems = [],
    isLoading: isFallbackLoading,
    refetch: refetchFallback,
  } = useAggregatedNews({
    industryId: constructionId ?? '',
    maxTotalItems: headlineLimit,
    enabled: shouldFetchFallback,
  })

  const { data: user } = useCurrentUser()
  const userId = user?.id

  const { data: generalInfo } = useGeneralInfoWidget(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

  const [preferences, setPreferences] = useState<NewsPreferences>({
    prioritizeTrending: true,
    matchSkills: true,
    matchIndustry: true,
    recentOnly: false,
  })
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  const { data: userSkills } = useSkillsWidget(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

  const skillKeywords = useMemo(() => {
    if (!userSkills) return [] as string[]
    const keywords = new Set<string>()
    for (const skill of userSkills as unknown as Array<Record<string, unknown>>) {
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
      typeof (generalInfo as unknown as { industry_name?: string })?.industry_name === 'string'
        ? (generalInfo as unknown as { industry_name: string }).industry_name
        : null

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
    const items = newsItems as unknown as NewsItem[]
    if (!items.length) return [] as EnrichedNewsItem[]

    const scored = items.map((item: NewsItem) => {
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

    const fallback = items
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

  // Enrich fallback news (construction) when primary returned empty
  const fallbackEnrichedNews = useMemo(() => {
    const items = fallbackNewsItems as unknown as NewsItem[]
    if (!items.length) return [] as EnrichedNewsItem[]

    return items
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

  // Display primary news if available, otherwise fallback (construction) news
  const displayNews = (newsItems as unknown[]).length > 0 ? enrichedNews : fallbackEnrichedNews

  const { theme } = useThemeContext()

  // Single state machine: resolving → loading → success | error | empty (or not_configured)
  const status: 'resolving' | 'loading' | 'error' | 'empty' | 'not_configured' | 'success' =
    isResolvingIndustry
      ? 'resolving'
      : !effectiveIndustryId
        ? 'not_configured'
        : isError && displayNews.length === 0
          ? 'error'
          : (isLoading && (newsItems as unknown[]).length === 0 && !shouldFetchFallback) ||
              (shouldFetchFallback && isFallbackLoading && displayNews.length === 0)
            ? 'loading'
            : displayNews.length === 0
              ? 'empty'
              : 'success'

  const handleRefetch = () => {
    void refetch()
    if (shouldFetchFallback || displayNews.length > 0) {
      void refetchFallback()
    }
  }

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
    router.push(ROUTES.DASHBOARD.NEWS.path)
  }

  const updatePreference = (key: keyof NewsPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const _relevanceLabel = (score: number) => {
    if (score >= 10) return 'High relevance'
    if (score >= 7) return 'Relevant'
    if (score >= 4) return 'General interest'
    return 'From your feeds'
  }

  const dividerColor = colors.border[theme].default

  // Always show the widget so the News section is visible; show loading, error, empty, or list
  return (
    <Stack gap={12}>
      <DashboardWidgetHeader
        title="News"
        action={
          <Row gap={4} align="center">
            <Button
              size="sm"
              variant="outline"
              onPress={handleRefetch}
              disabled={isLoading || (shouldFetchFallback && isFallbackLoading)}
              iconStart={RefreshCw}
            />
          </Row>
        }
      />

      {status === 'resolving' ? (
        <Stack align="center" gap={8}>
          <Spinner size="lg" color="primary" />
          <Text style={{ color: colors.text[theme].secondary }}>Loading news…</Text>
        </Stack>
      ) : status === 'not_configured' ? (
        <Stack align="center" gap={8}>
          <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
            News isn&apos;t configured. Run database seed and news import to see articles.
          </Text>
        </Stack>
      ) : status === 'loading' ? (
        <Stack align="center" gap={8}>
          <Spinner size="lg" color="primary" />
          <Text style={{ color: colors.text[theme].secondary }}>
            {shouldFetchFallback ? 'Loading news…' : 'Loading personalised news…'}
          </Text>
        </Stack>
      ) : status === 'error' ? (
        <Stack align="center" gap={8}>
          <AlertCircle size={24} color={colors.error[500]} />
          <Text style={{ color: colors.text[theme].primary, textAlign: 'center' }}>
            Failed to load news feed
          </Text>
          <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
            {error?.message || 'Please check your connection and try again.'}
          </Text>
          <Button variant="filled" color="primary" onPress={handleRefetch} size="sm">
            Try Again
          </Button>
        </Stack>
      ) : status === 'empty' ? (
        <Stack align="center" gap={8}>
          <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
            No articles right now. Check back later or try refreshing.
          </Text>
          <Button size="sm" variant="outline" onPress={handleRefetch} iconStart={RefreshCw}>
            Refresh
          </Button>
        </Stack>
      ) : null}

      {status === 'success' && (
        <Stack>
          {displayNews.map((item: EnrichedNewsItem, index: number) => (
            <Stack key={item.id}>
              {index > 0 && (
                <Stack style={{ height: 1, backgroundColor: dividerColor }} />
              )}
              <Pressable onPress={() => handleNewsClick(item)}>
                {({ pressed }) => (
                  <Row
                    gap={12}
                    align="flex-start"
                    style={{ paddingVertical: 12, opacity: pressed ? 0.6 : 1 }}
                  >
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={{ width: 72, height: 72, borderRadius: 8 }}
                        resizeMode="cover"
                      />
                    ) : null}
                    <Stack style={{ flex: 1 }} gap={4}>
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          lineHeight: 20,
                          color: colors.text[theme].primary,
                        }}
                      >
                        {item.title}
                      </Text>
                      {item.description ? (
                        <Text
                          numberOfLines={2}
                          style={{
                            fontSize: 13,
                            lineHeight: 18,
                            color: colors.text[theme].secondary,
                          }}
                        >
                          {item.description}
                        </Text>
                      ) : null}
                      <Row gap={6} align="center" wrap style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
                          {formatTimeAgo(item.pubDate)}
                        </Text>
                        {item.category ? (
                          <Stack
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              backgroundColor:
                                theme === 'dark' ? colors.bg[theme].subtle : colors.bg[theme].muted,
                              borderRadius: 4,
                            }}
                          >
                            <Text
                              style={{ fontSize: 11, color: colors.text[theme].secondary }}
                            >
                              {capitalise(item.category)}
                            </Text>
                          </Stack>
                        ) : null}
                        {item.source ? (
                          <Text
                            numberOfLines={1}
                            style={{ fontSize: 12, color: colors.text[theme].tertiary }}
                          >
                            {item.source}
                          </Text>
                        ) : null}
                      </Row>
                      {item.reasons.length > 0 ? (
                        <Row gap={4} wrap style={{ marginTop: 2 }}>
                          {item.reasons.slice(0, 2).map((reason: string, i: number) => (
                            <Stack
                              key={`${item.id}-r-${i}`}
                              style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                backgroundColor:
                                  theme === 'dark' ? colors.blue[900] : colors.blue[50],
                                borderRadius: 4,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: theme === 'dark' ? colors.blue[300] : colors.blue[700],
                                }}
                              >
                                {reason}
                              </Text>
                            </Stack>
                          ))}
                        </Row>
                      ) : null}
                    </Stack>
                  </Row>
                )}
              </Pressable>
            </Stack>
          ))}

          <Stack style={{ height: 1, backgroundColor: dividerColor, marginBottom: 12 }} />
          <Button size="sm" variant="outline" onPress={handleViewAll}>
            View All News
          </Button>
        </Stack>
      )}

      <Sheet
        visible={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        height="half"
      >
        <SheetHeader
          title="Customise Recommendations"
          onClose={() => setPreferencesOpen(false)}
          showCloseButton
        />
        <SheetContent>
          <Stack padding="md" gap={12}>
            <Paragraph size="sm" style={{ color: colors.text[theme].secondary }}>
              Tailor the news feed using your profile information.
            </Paragraph>

            <Stack gap={12}>
              <Row justify="space-between" align="center">
                <Paragraph size="sm">Match my skills</Paragraph>
                <Switch
                  size="sm"
                  checked={preferences.matchSkills}
                  onChange={(value) => updatePreference('matchSkills', value)}
                />
              </Row>

              <Row justify="space-between" align="center">
                <Paragraph size="sm">Match my industry</Paragraph>
                <Switch
                  size="sm"
                  checked={preferences.matchIndustry}
                  onChange={(value) => updatePreference('matchIndustry', value)}
                />
              </Row>

              <Row justify="space-between" align="center">
                <Paragraph size="sm">Boost trending stories</Paragraph>
                <Switch
                  size="sm"
                  checked={preferences.prioritizeTrending}
                  onChange={(value) => updatePreference('prioritizeTrending', value)}
                />
              </Row>

              <Row justify="space-between" align="center">
                <Paragraph size="sm">Show recent stories only</Paragraph>
                <Switch
                  size="sm"
                  checked={preferences.recentOnly}
                  onChange={(value) => updatePreference('recentOnly', value)}
                />
              </Row>
            </Stack>
          </Stack>
        </SheetContent>
      </Sheet>
    </Stack>
  )
}
