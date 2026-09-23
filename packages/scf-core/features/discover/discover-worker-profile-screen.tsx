import { ROUTES } from '@scf/core/constants/routes'
import { ProfileSkillsSection } from '@scf/core/features/profile/components/ProfileSkillsSection'
import {
  CertificationsWidget,
  EducationWidget,
  ExperienceWidget,
  GeneralInfoWidget,
  ReviewsWidget,
} from '@scf/core/features/profile/widgets'
import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { type BreadcrumbItemData, DashboardWidget } from '@scaffald/ui'
import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import type { DimensionValue } from 'react-native'
import { Animated, Easing, Platform } from 'react-native'
import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

const SHIMMER_WIDTH = 220

/**
 * One column is only easier to read than two if it stays a column. Left
 * unbounded it becomes a 1500px band with an avatar centred in the middle of
 * it, so cap it and keep its left edge under the heading.
 */
const READING_COLUMN = { width: '100%', maxWidth: 880, alignSelf: 'flex-start' } as const

/** On web, native driver is not supported; use JS driver to avoid console warning. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web'

interface DiscoverWorkerProfileScreenOptions {
  userId: string | null | undefined
}

interface DiscoverWorkerProfileScreenResult {
  /** One reading column — see the note on `readingColumn` below (#834). */
  content: ReactNode
  /** The person's name, so the heading says who this is rather than "Worker Profile". */
  screenTitle: string | null
  screenKicker?: string
  breadcrumbItems: BreadcrumbItemData[]
}

function SkeletonBlock({
  height,
  width = '100%',
  radius = 12,
}: {
  height: number
  width?: number | string
  radius?: number
}) {
  const { theme: skeletonTheme } = useThemeContext()
  const skeletonT = skeletonTheme === 'dark' ? ('dark' as const) : ('light' as const)
  const shimmer = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      })
    )

    loop.start()
    return () => {
      loop.stop()
      shimmer.stopAnimation()
    }
  }, [shimmer])

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHIMMER_WIDTH, SHIMMER_WIDTH],
  })

  return (
    <Stack
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: colors.border[skeletonT].default,
        height,
        width: (width ?? '100%') as DimensionValue,
        borderRadius: radius,
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: SHIMMER_WIDTH,
          transform: [{ translateX }],
          pointerEvents: 'none',
        }}
      >
        <LinearGradient
          start={[0, 0]}
          end={[1, 0]}
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </Stack>
  )
}

/** Mirrors the real column's order: identity, then proof, then history. */
function WorkerProfileSkeleton() {
  const wrapWidget = (content: ReactNode) => <DashboardWidget>{content}</DashboardWidget>
  const headlineWidths = [110, 90, 120] as const

  return (
    <Stack gap={16} style={READING_COLUMN}>
      {wrapWidget(
        <Stack gap={12} align="center">
          <SkeletonBlock height={96} width={96} radius={48} />
          <SkeletonBlock height={24} width="60%" />
          <SkeletonBlock height={18} width="40%" />
          <Row gap={8} wrap justify="center">
            {headlineWidths.map((width) => (
              <SkeletonBlock key={`headline-${width}`} height={16} width={width} radius={8} />
            ))}
          </Row>
        </Stack>
      )}

      {wrapWidget(
        <Stack gap={12}>
          <SkeletonBlock height={20} width="45%" />
          <Row gap={8} wrap>
            {['proof-1', 'proof-2', 'proof-3', 'proof-4'].map((id) => (
              <SkeletonBlock key={id} height={28} width={120} radius={14} />
            ))}
          </Row>
        </Stack>
      )}

      {wrapWidget(
        <Stack gap={12}>
          <SkeletonBlock height={20} width="35%" />
          <Row gap={8} wrap>
            {['skill-1', 'skill-2', 'skill-3', 'skill-4', 'skill-5', 'skill-6'].map((skillId) => (
              <SkeletonBlock key={skillId} height={28} width={100} radius={14} />
            ))}
          </Row>
        </Stack>
      )}

      {wrapWidget(
        <Stack gap={12}>
          <SkeletonBlock height={20} width="55%" />
          {['role-1', 'role-2'].map((roleId) => (
            <Stack key={roleId} gap={4}>
              <SkeletonBlock height={16} width="70%" />
              <SkeletonBlock height={12} width="40%" />
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  )
}

export function DiscoverWorkerProfileScreen({
  userId,
}: DiscoverWorkerProfileScreenOptions): DiscoverWorkerProfileScreenResult {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const safeUserId = typeof userId === 'string' ? userId : null
  const { session } = useSessionContext()
  const currentUserId = session?.user?.id

  const generalInfoQuery = useGeneralInfoWidget(
    { userId: safeUserId || '' },
    {
      enabled: Boolean(safeUserId),
      staleTime: 5 * 60 * 1000,
    }
  )

  const baseBreadcrumbs: BreadcrumbItemData[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Workers', href: ROUTES.WORKERS.path },
  ]

  if (!safeUserId) {
    return {
      content: (
        <DashboardWidget>
          <Stack align="center" justify="center" gap={8} paddingVertical={32}>
            <Text style={{ color: colors.text[t].secondary }}>
              Select a worker from the list to view their profile.
            </Text>
          </Stack>
        </DashboardWidget>
      ),
      screenTitle: 'Worker not found',
      breadcrumbItems: [...baseBreadcrumbs, { label: 'Worker not found' }],
    }
  }

  const showSkeleton = generalInfoQuery.isLoading && !generalInfoQuery.data
  if (showSkeleton) {
    return {
      content: <WorkerProfileSkeleton />,
      screenTitle: null,
      breadcrumbItems: [...baseBreadcrumbs, { label: 'Loading…' }],
    }
  }

  const generalInfo = generalInfoQuery.data
  if (!generalInfo) {
    return {
      content: (
        <DashboardWidget>
          <Stack align="center" justify="center" gap={8} paddingVertical={32}>
            <Text style={{ color: colors.text[t].secondary, textAlign: 'center' }}>
              We couldn&apos;t load this worker profile. Please try another worker.
            </Text>
          </Stack>
        </DashboardWidget>
      ),
      screenTitle: 'Profile unavailable',
      breadcrumbItems: [...baseBreadcrumbs, { label: 'Profile unavailable' }],
    }
  }

  const displayName =
    generalInfo.display_name ||
    (generalInfo.privateData?.first_name && generalInfo.privateData?.last_name
      ? `${generalInfo.privateData.first_name} ${generalInfo.privateData.last_name}`
      : generalInfo.username) ||
    'Worker Profile'

  const isOwnProfile = currentUserId === safeUserId

  const breadcrumbItems = [
    ...baseBreadcrumbs,
    {
      label: isOwnProfile ? 'My Profile' : displayName,
      isActive: true,
    },
  ]

  /**
   * One reading column (#834). This was two golden-ratio columns, which put
   * reviews level with the person's name and split "what they can do" across
   * the fold: skills sat on the right while the experience that backs them
   * sat on the left. Read top to bottom instead — who they are, what they are
   * certified to do, the skills they claim, then the history and reviews that
   * support both.
   */
  const content = (
    <Stack gap={16} style={READING_COLUMN}>
      <GeneralInfoWidget
        userId={safeUserId}
        showEdit={false}
        showButtons={!isOwnProfile}
        isOwnProfile={isOwnProfile}
      />
      <CertificationsWidget userId={safeUserId} showEdit={false} />
      <ProfileSkillsSection userId={safeUserId} showEdit={false} />
      <ExperienceWidget userId={safeUserId} showEdit={false} />
      <EducationWidget userId={safeUserId} showEdit={false} />
      <ReviewsWidget userId={safeUserId} showEdit />
    </Stack>
  )

  return {
    content,
    screenTitle: isOwnProfile ? 'My Profile' : displayName,
    screenKicker: 'Worker',
    breadcrumbItems,
  }
}
