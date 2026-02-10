import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import type { NewsItem } from '@scf/core/features/news'
import { useAggregatedNews } from '@scf/core/features/news/hooks/useNewsFeed'
import { redirect } from '@scf/core/utils/redirect'
import { supabase } from '@scf/core/utils/supabase/client'
import { AlertCircle, ExternalLink, RefreshCw } from '@tamagui/lucide-icons'
import {
  Button,
  Card,
  spacing,
  Paragraph,
  Spinner,
  Text,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState, type ReactNode } from 'react'
import { Platform, Image, Pressable, StyleSheet, View } from 'react-native'
import { colors } from '@unicornlove/beyond-ui/tokens'
import { useThemeContext } from '@unicornlove/beyond-ui'

const FULL_PAGE_ITEM_COUNT = 40
const DEFAULT_INDUSTRY = 'construction'

// Simple NewsCard component (temporary inline replacement)
interface NewsCardProps {
  title: string
  description?: string
  image?: string
  footer?: ReactNode
  onPress?: () => void
  fullCardClickable?: boolean
  minHeight?: number
}

const NewsCard = ({ title, description, image, footer, onPress, fullCardClickable, minHeight = 220 }: NewsCardProps) => {
  const { theme } = useThemeContext()
  const [imageError, setImageError] = useState(false)
  const fallbackImage = `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`
  const imageSource = imageError ? fallbackImage : image || fallbackImage

  return (
    <Pressable
      onPress={fullCardClickable ? onPress : undefined}
      style={({ pressed }) => [
        styles.newsCard,
        { minHeight, backgroundColor: colors.background[theme].elevated },
        pressed && styles.pressed,
      ]}
    >
      <Image
        source={{ uri: imageSource }}
        style={styles.newsCardImage}
        onError={() => setImageError(true)}
      />
      <View style={styles.newsCardOverlay} />
      <Stack padding={spacing[5]} style={styles.newsCardContent}>
        <Stack gap={spacing[3]}>
          <Text
            size="lg"
            weight="bold"
            color={colors.text[theme].primary}
            numberOfLines={2}
          >
            {title}
          </Text>
          {description && (
            <Text
              size="sm"
              color={colors.text[theme].secondary}
              numberOfLines={3}
            >
              {description}
            </Text>
          )}
          {footer && <Row gap={spacing[3]} style={styles.newsCardFooter}>{footer}</Row>}
        </Stack>
      </Stack>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  newsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  newsCardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  newsCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  newsCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  newsCardFooter: {
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
})

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
    <Stack gap="$4" paddingHorizontal={spacing.lg} paddingVertical={spacing.lg}>
      <Stack gap="$2">
        <Text fontSize="$8" fontWeight="700" color="$color12">
          Industry News
        </Text>
        <Paragraph size="$4" color="$color10">
          Curated headlines across construction, safety, technology, and workforce development.
        </Paragraph>
      </Stack>

      <Row gap="$2">
        <Button
          size="sm"
          variant="outline"
          color="gray"
          iconStart={RefreshCw}
          onPress={() => {
            void refetch()
          }}
          disabled={isLoading}
        >
          Refresh
        </Button>
        <Button size="sm" variant="outline" color="gray" onPress={() => router.back()}>
          Back
        </Button>
      </Row>

      {isLoading && newsItems.length === 0 ? (
        <Stack alignItems="center" gap="$3" paddingVertical="$8">
          <Spinner size="large" color="$blue7" />
          <Text color="$color11" fontSize="$5">
            Loading latest news…
          </Text>
        </Stack>
      ) : null}

      {isError ? (
        <Stack alignItems="center" gap="$3" paddingVertical="$8">
          <AlertCircle size={32} color="$red10" />
          <Text color="$red11" fontSize="$5" style={{ textAlign: 'center' }}>
            Unable to load news at the moment.
          </Text>
          <Text color="$color11" fontSize="$4" style={{ textAlign: 'center' }}>
            {error?.message || 'Please check your connection and try again.'}
          </Text>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            onPress={() => {
              void refetch()
            }}
          >
            Retry
          </Button>
        </Stack>
      ) : null}

      {!isLoading && !isError && newsItems.length === 0 ? (
        <Stack alignItems="center" gap="$3" paddingVertical="$8">
          <Text color="$color11" fontSize="$5" fontWeight="600">
            No articles found
          </Text>
          <Text color="$color10" fontSize="$4" style={{ textAlign: 'center' }}>
            Please check again soon for more industry updates.
          </Text>
        </Stack>
      ) : null}

      <Stack gap="$4">
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
              <Row gap="$3" alignItems="center">
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
              </Row>
            }
          />
        ))}
      </Stack>
    </Stack>
  )

  return <DashboardPage showBreadcrumb={false} pageTitle="Industry News" leftContent={content} />
}
