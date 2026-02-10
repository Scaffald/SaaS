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
import { api } from '@scf/core/utils/api'
import { type BreadcrumbItem, DashboardWidget } from '@unicornlove/beyond-ui'
import { LinearGradient } from '@tamagui/linear-gradient'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'

const SHIMMER_WIDTH = 220

interface DiscoverWorkerProfileScreenOptions {
  userId: string | null | undefined
}

interface DiscoverWorkerProfileScreenResult {
  left: ReactNode
  right: ReactNode
  breadcrumbItems: BreadcrumbItem[]
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
  const shimmer = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
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
      position="relative"
      overflow="hidden"
      backgroundColor="$color4"
      height={height}
      width={typeof width === 'number' ? width : undefined}
      style={{
        borderRadius: radius,
        width: typeof width === 'string' ? width : undefined,
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: SHIMMER_WIDTH,
          transform: [{ translateX }],
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

function WorkerColumnSkeleton({ variant }: { variant: 'left' | 'right' }) {
  const wrapWidget = (content: ReactNode) => <DashboardWidget>{content}</DashboardWidget>

  if (variant === 'left') {
    const headlineWidths = [110, 90, 120] as const
    const overviewSections = ['overview-primary', 'overview-secondary'] as const
    return (
      <Stack gap="$4">
        {wrapWidget(
          <Stack gap="$3" alignItems="center">
            <SkeletonBlock height={96} width={96} radius={48} />
            <SkeletonBlock height={24} width="60%" />
            <SkeletonBlock height={18} width="40%" />
            <Row gap="$2" flexWrap="wrap" justifyContent="center">
              {headlineWidths.map((width) => (
                <SkeletonBlock key={`headline-${width}`} height={16} width={width} radius={8} />
              ))}
            </Row>
          </Stack>
        )}

        {wrapWidget(
          <Stack gap="$3">
            {overviewSections.map((sectionId) => (
              <Stack key={sectionId} gap="$2">
                <SkeletonBlock height={20} width="70%" />
                <SkeletonBlock height={14} width="50%" />
                <SkeletonBlock height={12} width="40%" />
                <SkeletonBlock height={12} width="60%" />
              </Stack>
            ))}
          </Stack>
        )}

        {wrapWidget(
          <Stack gap="$2">
            <SkeletonBlock height={20} width="55%" />
            <SkeletonBlock height={14} width="65%" />
            <SkeletonBlock height={12} width="40%" />
          </Stack>
        )}
      </Stack>
    )
  }

  return (
    <Stack gap="$4">
      {wrapWidget(
        <Stack gap="$3">
          <SkeletonBlock height={20} width="60%" />
          {['review-1', 'review-2'].map((reviewId) => (
            <Stack key={reviewId} gap="$1">
              <SkeletonBlock height={16} width="80%" />
              <SkeletonBlock height={12} width="55%" />
            </Stack>
          ))}
        </Stack>
      )}

      {wrapWidget(
        <Stack gap="$3">
          <SkeletonBlock height={20} width="45%" />
          <Row gap="$2" flexWrap="wrap">
            {['skill-1', 'skill-2', 'skill-3', 'skill-4', 'skill-5', 'skill-6'].map((skillId) => (
              <SkeletonBlock key={skillId} height={28} width={100} radius={14} />
            ))}
          </Row>
        </Stack>
      )}

      {wrapWidget(
        <Stack gap="$3">
          <SkeletonBlock height={20} width="55%" />
          {['stat-1', 'stat-2', 'stat-3'].map((statId) => (
            <Stack key={statId} gap="$1">
              <SkeletonBlock height={16} width="70%" />
              <SkeletonBlock height={12} width="40%" />
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  )
}

function createSkeletonLayout(): DiscoverWorkerProfileScreenResult {
  const skeletonBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Workers', href: ROUTES.DASHBOARD.DISCOVER.WORKERS.path },
    { label: 'Loading…', isActive: true },
  ]

  return {
    left: <WorkerColumnSkeleton variant="left" />,
    right: <WorkerColumnSkeleton variant="right" />,
    breadcrumbItems: skeletonBreadcrumbs,
  }
}

export function DiscoverWorkerProfileScreen({
  userId,
}: DiscoverWorkerProfileScreenOptions): DiscoverWorkerProfileScreenResult {
  const safeUserId = typeof userId === 'string' ? userId : null
  const { session } = useSessionContext()
  const currentUserId = session?.user?.id

  const generalInfoQuery = api.profile.widgets.getGeneralInfo.useQuery(
    { userId: safeUserId || '' },
    {
      enabled: Boolean(safeUserId),
      staleTime: 5 * 60 * 1000,
    }
  )

  const baseBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Workers', href: ROUTES.DASHBOARD.DISCOVER.WORKERS.path },
  ]

  if (!safeUserId) {
    const errorWidget = (
      <DashboardWidget>
        <Stack alignItems="center" justifyContent="center" gap="$2" paddingVertical="$8">
          <Text fontSize="$6" fontWeight="700" color="$red10">
            Worker not found
          </Text>
          <Text color="$color11">Select a worker from the list to view their profile.</Text>
        </Stack>
      </DashboardWidget>
    )

    return {
      left: errorWidget,
      right: errorWidget,
      breadcrumbItems: [...baseBreadcrumbs, { label: 'Worker not found', isActive: true }],
    }
  }

  const showSkeleton = generalInfoQuery.isLoading && !generalInfoQuery.data
  if (showSkeleton) {
    return createSkeletonLayout()
  }

  const generalInfo = generalInfoQuery.data
  if (!generalInfo) {
    const unavailableWidget = (
      <DashboardWidget>
        <Stack alignItems="center" justifyContent="center" gap="$2" paddingVertical="$8">
          <Text fontSize="$6" fontWeight="700" color="$red10">
            Profile unavailable
          </Text>
          <Text color="$color11" style={{ textAlign: 'center' }}>
            We couldn&apos;t load this worker profile. Please try another worker.
          </Text>
        </Stack>
      </DashboardWidget>
    )

    return {
      left: unavailableWidget,
      right: unavailableWidget,
      breadcrumbItems: [...baseBreadcrumbs, { label: 'Profile unavailable', isActive: true }],
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

  const leftColumn = (
    <Stack gap="$4">
      <GeneralInfoWidget
        userId={safeUserId}
        showEdit={false}
        showButtons={!isOwnProfile}
        isOwnProfile={isOwnProfile}
      />
      <ExperienceWidget userId={safeUserId} showEdit={false} />
      <EducationWidget userId={safeUserId} showEdit={false} />
    </Stack>
  )

  const rightColumn = (
    <Stack gap="$4">
      <ReviewsWidget userId={safeUserId} showEdit />
      <ProfileSkillsSection userId={safeUserId} showEdit={false} />
      <CertificationsWidget userId={safeUserId} showEdit={false} />
    </Stack>
  )

  return {
    left: leftColumn,
    right: rightColumn,
    breadcrumbItems,
  }
}
