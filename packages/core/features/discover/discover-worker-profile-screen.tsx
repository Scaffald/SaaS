import { ROUTES } from '@app/core/constants/routes'
import { ConnectionFollowButtons } from '@app/core/features/connections/components/ConnectionFollowButtons'
import {
  CertificationsWidget,
  EducationWidget,
  ExperienceWidget,
  GeneralInfoWidget,
  ReviewsWidget,
  SkillsWidget,
} from '@app/core/features/profile/widgets'
import { useSessionContext } from '@app/core/utils/supabase/useSessionContext'
import { api } from '@app/core/utils/api'
import { type BreadcrumbItem, DashboardWidget } from '@app/ui'
import { LinearGradient } from '@tamagui/linear-gradient'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

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
    <YStack
      position="relative"
      overflow="hidden"
      bg="$color4"
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
    </YStack>
  )
}

function WorkerColumnSkeleton({ variant }: { variant: 'left' | 'right' }) {
  const wrapWidget = (content: ReactNode) => <DashboardWidget>{content}</DashboardWidget>

  if (variant === 'left') {
    const headlineWidths = [110, 90, 120] as const
    const overviewSections = ['overview-primary', 'overview-secondary'] as const
    return (
      <YStack gap="$4">
        {wrapWidget(
          <YStack gap="$3" items="center">
            <SkeletonBlock height={96} width={96} radius={48} />
            <SkeletonBlock height={24} width="60%" />
            <SkeletonBlock height={18} width="40%" />
            <XStack gap="$2" flexWrap="wrap" justify="center">
              {headlineWidths.map((width) => (
                <SkeletonBlock key={`headline-${width}`} height={16} width={width} radius={8} />
              ))}
            </XStack>
          </YStack>
        )}

        {wrapWidget(
          <YStack gap="$3">
            {overviewSections.map((sectionId) => (
              <YStack key={sectionId} gap="$2">
                <SkeletonBlock height={20} width="70%" />
                <SkeletonBlock height={14} width="50%" />
                <SkeletonBlock height={12} width="40%" />
                <SkeletonBlock height={12} width="60%" />
              </YStack>
            ))}
          </YStack>
        )}

        {wrapWidget(
          <YStack gap="$2">
            <SkeletonBlock height={20} width="55%" />
            <SkeletonBlock height={14} width="65%" />
            <SkeletonBlock height={12} width="40%" />
          </YStack>
        )}
      </YStack>
    )
  }

  return (
    <YStack gap="$4">
      {wrapWidget(
        <YStack gap="$3">
          <SkeletonBlock height={20} width="45%" />
          <XStack gap="$2" flexWrap="wrap">
            {['skill-1', 'skill-2', 'skill-3', 'skill-4', 'skill-5', 'skill-6'].map((skillId) => (
              <SkeletonBlock key={skillId} height={28} width={100} radius={14} />
            ))}
          </XStack>
        </YStack>
      )}

      {wrapWidget(
        <YStack gap="$3">
          <SkeletonBlock height={20} width="55%" />
          {['stat-1', 'stat-2', 'stat-3'].map((statId) => (
            <YStack key={statId} gap="$1">
              <SkeletonBlock height={16} width="70%" />
              <SkeletonBlock height={12} width="40%" />
            </YStack>
          ))}
        </YStack>
      )}

      {wrapWidget(
        <YStack gap="$3">
          <SkeletonBlock height={20} width="60%" />
          {['review-1', 'review-2'].map((reviewId) => (
            <YStack key={reviewId} gap="$1">
              <SkeletonBlock height={16} width="80%" />
              <SkeletonBlock height={12} width="55%" />
            </YStack>
          ))}
        </YStack>
      )}
    </YStack>
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
        <YStack items="center" justify="center" gap="$2" py="$8">
          <Text fontSize="$6" fontWeight="700" color="$red10">
            Worker not found
          </Text>
          <Text color="$color11">Select a worker from the list to view their profile.</Text>
        </YStack>
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
        <YStack items="center" justify="center" gap="$2" py="$8">
          <Text fontSize="$6" fontWeight="700" color="$red10">
            Profile unavailable
          </Text>
          <Text color="$color11" style={{ textAlign: 'center' }}>
            We couldn&apos;t load this worker profile. Please try another worker.
          </Text>
        </YStack>
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
    <YStack gap="$4">
      {/* Connection and Follow Buttons */}
      {!isOwnProfile && (
        <ConnectionFollowButtons targetUserId={safeUserId} isOwnProfile={isOwnProfile} />
      )}
      <GeneralInfoWidget userId={safeUserId} showEdit={false} />
      <ExperienceWidget userId={safeUserId} showEdit={false} />
      <EducationWidget userId={safeUserId} showEdit={false} />
    </YStack>
  )

  const rightColumn = (
    <YStack gap="$4">
      <SkillsWidget userId={safeUserId} showEdit={false} />
      <CertificationsWidget userId={safeUserId} showEdit={false} />
      <ReviewsWidget userId={safeUserId} showEdit />
    </YStack>
  )

  return {
    left: leftColumn,
    right: rightColumn,
    breadcrumbItems,
  }
}
