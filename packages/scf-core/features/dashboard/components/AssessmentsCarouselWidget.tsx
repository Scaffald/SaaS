import { ROUTES } from '@scf/core/constants/routes'
import { useIPIPStatus } from '@scf/core/utils/personality-assessment-sdk-hooks'
import { useRIASECStatus, useOccupationStatus } from '@scf/core/utils/onet-sdk-hooks'
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
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { ScrollView, type NativeSyntheticEvent, type NativeScrollEvent, Pressable } from 'react-native'

type AssessmentCardData = {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: { bg: string; text: string }
  ctaLabel: string
  route: string
  isActive: boolean
}

function useAssessmentCards(): { cards: AssessmentCardData[]; isLoading: boolean } {
  const { data: ipipData, isLoading: loadingIPIP } = useIPIPStatus()
  const { data: riasecData, isLoading: loadingRIASEC } = useRIASECStatus()
  const { data: occupationData, isLoading: loadingOcc } = useOccupationStatus()

  const isLoading = loadingIPIP || loadingRIASEC || loadingOcc

  if (isLoading) {
    return { cards: [], isLoading: true }
  }

  // These hooks may wrap data in { data: ... } or return the status directly
  const ipipCompleted = !!(ipipData as { data?: { isCompleted?: boolean } })?.data?.isCompleted
    || !!(ipipData as { isCompleted?: boolean })?.isCompleted
  const riasecCompleted = !!(riasecData as { isCompleted?: boolean })?.isCompleted
    || !!(riasecData as { complete?: boolean })?.complete
  const occupationCompleted = !!(occupationData as { isCompleted?: boolean })?.isCompleted
    || !!(occupationData as { selected?: boolean })?.selected

  const cards: AssessmentCardData[] = [
    {
      id: 'ipip',
      title: 'Personality Profile',
      description:
        'Comprehensive Big Five personality assessment measuring openness, conscientiousness, extraversion, agreeableness, and emotional stability.',
      badge: ipipCompleted ? 'Expert' : 'Not Started',
      badgeColor: ipipCompleted
        ? { bg: colors.indigo[50], text: colors.indigo[700] }
        : { bg: colors.gray[100], text: colors.gray[600] },
      ctaLabel: ipipCompleted ? 'View Results' : 'Get Started',
      route: ipipCompleted ? ROUTES.DASHBOARD.ASSESSMENTS.IPIP.RESULTS.path : ROUTES.DASHBOARD.ASSESSMENTS.IPIP.path,
      isActive: ipipCompleted,
    },
    {
      id: 'riasec',
      title: 'Career Interests',
      description:
        'RIASEC assessment to discover your career interest profile and match you with occupations that align with your work style preferences.',
      badge: riasecCompleted ? 'Certified' : 'Not Started',
      badgeColor: riasecCompleted
        ? { bg: colors.emerald[100], text: colors.emerald[700] }
        : { bg: colors.gray[100], text: colors.gray[600] },
      ctaLabel: riasecCompleted ? 'View Results' : 'Get Started',
      route: ROUTES.DASHBOARD.ASSESSMENTS.RIASEC.path,
      isActive: riasecCompleted,
    },
    {
      id: 'occupation',
      title: 'Occupation Preferences',
      description:
        'Select and rank your target occupations to receive personalized career recommendations, skills gap analysis, and job matches.',
      badge: occupationCompleted ? 'Advanced' : 'Not Started',
      badgeColor: occupationCompleted
        ? { bg: colors.indigo[50], text: colors.indigo[700] }
        : { bg: colors.gray[100], text: colors.gray[600] },
      ctaLabel: occupationCompleted ? 'Update Preferences' : 'Get Started',
      route: ROUTES.DASHBOARD.ASSESSMENTS.OCCUPATION.path,
      isActive: occupationCompleted,
    },
  ]

  return { cards, isLoading: false }
}

function AssessmentCard({ card, isFirst }: { card: AssessmentCardData; isFirst: boolean }) {
  const { theme } = useThemeContext()
  const router = useRouter()

  const isFeatured = isFirst && card.isActive

  return (
    <Pressable
      onPress={() => router.push(card.route as never)}
      style={{
        padding: 24,
        borderRadius: 16,
        minWidth: 240,
        maxWidth: 260,
        backgroundColor: isFeatured ? colors.bg[theme].default : colors.bg[theme].subtle,
        borderWidth: isFeatured ? 2 : 1,
        borderColor: isFeatured ? colors.primary[200] : colors.border[theme].ghost,
        gap: 16,
      }}
    >
      <Row justify="space-between" align="center">
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: colors.text[theme].primary,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {card.title}
        </Text>
        <Stack
          paddingHorizontal={8}
          paddingVertical={2}
          borderRadius={4}
          style={{ backgroundColor: card.badgeColor.bg }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: card.badgeColor.text,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {card.badge}
          </Text>
        </Stack>
      </Row>

      <Text
        style={{
          fontSize: 14,
          color: colors.text[theme].secondary,
          lineHeight: 20,
        }}
        numberOfLines={3}
      >
        {card.description}
      </Text>

      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: colors.primary[600],
          marginTop: 'auto' as never,
        }}
      >
        {card.ctaLabel}
      </Text>
    </Pressable>
  )
}

export function AssessmentsCarouselWidget() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const { cards, isLoading } = useAssessmentCards()
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x
    const cardWidth = 260 + 24 // card width + gap
    const idx = Math.round(x / cardWidth)
    setActiveIndex(Math.min(idx, cards.length - 1))
  }

  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={16} animation="wave">
          <Skeleton width={160} height={24} borderRadius={4} />
          <Skeleton width="100%" height={12} borderRadius={4} />
          <Row gap={24}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width={240} height={180} borderRadius={16} />
            ))}
          </Row>
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <Stack gap={8}>
        <Row justify="space-between" align="center">
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.text[theme].primary,
            }}
          >
            Assessments
          </Text>
          <Row gap={4}>
            <Pressable
              onPress={() => {
                const prev = Math.max(0, activeIndex - 1)
                scrollRef.current?.scrollTo({ x: prev * 284, animated: true })
                setActiveIndex(prev)
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : activeIndex === 0 ? 0.3 : 0.7, padding: 4 })}
              disabled={activeIndex === 0}
            >
              <ChevronLeft size={18} color={colors.text[theme].primary} />
            </Pressable>
            <Pressable
              onPress={() => {
                const next = Math.min(cards.length - 1, activeIndex + 1)
                scrollRef.current?.scrollTo({ x: next * 284, animated: true })
                setActiveIndex(next)
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : activeIndex >= cards.length - 1 ? 0.3 : 0.7, padding: 4 })}
              disabled={activeIndex >= cards.length - 1}
            >
              <ChevronRight size={18} color={colors.text[theme].primary} />
            </Pressable>
          </Row>
        </Row>

        <Text
          style={{
            fontSize: 14,
            color: colors.text[theme].secondary,
            maxWidth: 500,
          }}
        >
          Demonstrate your expertise. Completed assessments unlock career recommendations and job matching.
        </Text>
      </Stack>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ gap: 24, paddingVertical: 8 }}
        decelerationRate="fast"
        snapToInterval={284}
      >
        {cards.map((card, i) => (
          <AssessmentCard key={card.id} card={card} isFirst={i === 0} />
        ))}
      </ScrollView>

      {/* Pagination dots + View All */}
      <Row justify="space-between" align="center">
        <Row gap={8}>
          {cards.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => {
                scrollRef.current?.scrollTo({ x: i * 284, animated: true })
                setActiveIndex(i)
              }}
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor:
                  i === activeIndex ? colors.primary[600] : colors.gray[300],
              }}
            />
          ))}
        </Row>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: colors.primary[600],
          }}
          onPress={() => router.push(ROUTES.DASHBOARD.ASSESSMENTS.path as never)}
        >
          View All
        </Text>
      </Row>
    </DashboardWidget>
  )
}
