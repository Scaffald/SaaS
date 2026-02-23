import { ROUTES, buildPath } from '@scf/core/constants/routes'
import {
  useOrganization,
  useOrganizationOpenJobsCount,
} from '@scf/core/utils/organizations-sdk-hooks'
import { useUserProfilePreview } from '@scf/core/utils/user-profiles-sdk-hooks'
import { getStorageUrl } from '@scf/core/utils/supabase/storage'
import type { ViewProps } from 'react-native'
import { View, Image } from 'react-native'

type ViewWithMouseProps = ViewProps & {
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}
import { Briefcase, Building2, ExternalLink, MapPin, User } from 'lucide-react-native'
import { Button, Spinner, Text, Row, Stack } from '@scaffald/ui'

interface ProfileHoverCardProps {
  /** Pin ID (user ID or organization ID) */
  pinId: string | null
  /** Type of pin being hovered */
  pinType: 'worker' | 'organization' | null
  /** Whether the card should be visible */
  visible: boolean
  /** Position of the card relative to the pin */
  position?: { x: number; y: number }
  /** Callback when the hover card gains pointer focus */
  onHoverCardEnter?: () => void
  /** Callback when the hover card loses pointer focus */
  onHoverCardLeave?: () => void
}

/**
 * ProfileHoverCard Component
 *
 * Displays condensed profile information when hovering over map pins.
 * Shows worker or organization preview with key metrics.
 */
export function ProfileHoverCard({
  pinId,
  pinType,
  visible,
  position,
  onHoverCardEnter,
  onHoverCardLeave,
}: ProfileHoverCardProps) {
  // Fetch worker preview data (lightweight)
  const { data: workerPreview, isLoading: isLoadingWorker } = useUserProfilePreview(
    pinId ?? undefined,
    {
    enabled: pinType === 'worker' && visible,
  })

  // Fetch organization data
  const { data: organization, isLoading: isLoadingOrg } = useOrganization(pinId || undefined, {
    enabled: !!pinId && pinType === 'organization' && visible,
  })

  // Fetch open jobs count for organizations
  const jobsCountQuery = useOrganizationOpenJobsCount(pinId || undefined, {
    enabled: !!pinId && pinType === 'organization' && visible,
  })
  const jobsCount: number = (() => {
    const data = jobsCountQuery.data
    if (typeof data === 'number') return data
    if (data && typeof data === 'object' && 'count' in data) {
      return (data as { count: number; organizationId: string }).count
    }
    return 0
  })()

  if (!visible || !pinId || !pinType) {
    return null
  }

  const isLoading = pinType === 'worker' ? isLoadingWorker : isLoadingOrg

  // Get avatar URL for workers
  const avatarUrl =
    pinType === 'worker' && workerPreview?.avatarPath
      ? getStorageUrl('avatars', workerPreview.avatarPath)
      : workerPreview?.avatarUrl || null

  const profileUrl =
    pinType === 'worker'
      ? buildPath(ROUTES.DASHBOARD.DISCOVER.WORKERS.DETAIL, { id: pinId })
      : pinType === 'organization'
        ? buildPath(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.DETAIL, { id: pinId })
        : null

  const handleOpenProfile = () => {
    if (!profileUrl) {
      return
    }
    if (typeof window !== 'undefined') {
      window.open(profileUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const viewProps: ViewWithMouseProps = {
    style: {
      position: 'absolute',
      backgroundColor: 'var(--color-background, #fff)',
      borderColor: 'var(--color-6, #e5e5e5)',
      borderWidth: 1,
      borderRadius: 16,
      padding: 12,
      minWidth: 240,
      maxWidth: 300,
      zIndex: 1000,
      top: position?.y ?? 0,
      left: position?.x ?? 0,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      pointerEvents: 'auto',
      transform: [{ translateX: -0 }, { translateY: -4 }],
    },
    onMouseEnter: onHoverCardEnter,
    onMouseLeave: onHoverCardLeave,
  }

  return (
    <ViewWithMouse {...viewProps}>
      {isLoading ? (
        <Stack align="center" paddingVertical={16} gap={8}>
          <Spinner size="sm" color="primary" />
          <Text color="gray">Loading...</Text>
        </Stack>
      ) : pinType === 'worker' && workerPreview ? (
        <Stack gap={8}>
          {/* Header with avatar and name */}
          <Row gap={12} align="center">
            {avatarUrl ? (
              <Stack
                width={48}
                height={48}
                borderRadius={10}
                backgroundColor="$color3"
                style={{ overflow: 'hidden' }}
              >
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 48, height: 48 }}
                  resizeMode="cover"
                  accessibilityLabel={workerPreview.displayName || 'Worker'}
                />
              </Stack>
            ) : (
              <Stack
                width={48}
                height={48}
                borderRadius={10}
                backgroundColor="$blue4"
                align="center"
                justify="center"
              >
                <User size={24} color="#0ea5e9" />
              </Stack>
            )}
            <Stack flex={1} gap={4}>
              <Text color="gray">{workerPreview.displayName}</Text>
              {workerPreview.headline && <Text color="gray">{workerPreview.headline}</Text>}
            </Stack>
            {profileUrl ? (
              <Button
                size="sm"
                variant="outline"
                iconStart={ExternalLink}
                aria-label="View full profile in new tab"
                onPress={handleOpenProfile}
              />
            ) : null}
          </Row>

          {/* Location */}
          {workerPreview.location && (
            <Row gap={8} align="center">
              <MapPin size={20} color="#737373" />
              <Text color="gray">{workerPreview.location}</Text>
            </Row>
          )}

          {/* Top Skills */}
          {workerPreview.topSkills && workerPreview.topSkills.length > 0 && (
            <Row gap={4} wrap>
              {workerPreview.topSkills
                .slice(0, 3)
                .map((skill: (typeof workerPreview.topSkills)[0]) => {
                  const skillKey =
                    skill.csiSkillId ||
                    skill.onetOccupationId ||
                    skill.taxonomy ||
                    `skill-${Math.random()}`
                  return (
                    <Stack
                      key={skillKey}
                      paddingHorizontal={8}
                      paddingVertical={4}
                      borderRadius={8}
                      style={{ backgroundColor: 'var(--color-blue-4, #bae6fd)' }}
                    >
                      <Text style={{ color: 'var(--color-blue-11, #0c4a6e)' }}>
                        {skill.taxonomy || 'Skill'}
                      </Text>
                    </Stack>
                  )
                })}
              {workerPreview.topSkills.length > 3 && (
                <Text color="gray">+{workerPreview.topSkills.length - 3} more</Text>
              )}
            </Row>
          )}
        </Stack>
      ) : pinType === 'organization' && organization ? (
        <Stack gap={8}>
          {/* Header with icon and name */}
          <Row gap={12} align="center">
            <Stack
              width={48}
              height={48}
              borderRadius={24}
              backgroundColor="$blue4"
              align="center"
              justify="center"
            >
              <Building2 size={24} color="#0ea5e9" />
            </Stack>
            <Stack flex={1} gap={4}>
              <Text color="gray">{organization.name}</Text>
              {(organization as { industry_name?: string }).industry_name && (
                <Text color="gray">{(organization as { industry_name?: string }).industry_name}</Text>
              )}
            </Stack>
            {profileUrl ? (
              <Button
                size="sm"
                variant="outline"
                iconStart={ExternalLink}
                aria-label="View organization in new tab"
                onPress={handleOpenProfile}
              />
            ) : null}
          </Row>

          {/* Location */}
          {organization.address &&
            typeof organization.address === 'object' &&
            'city' in organization.address && (
              <Row gap={8} align="center">
                <MapPin size="md" color="$gray11" />
                <Text color="$gray11">
                  {[
                    (organization.address as { city?: string }).city,
                    (organization.address as { state?: string }).state,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </Row>
            )}

          {/* Key Metrics */}
          <Row gap={12} wrap>
            {jobsCount > 0 && (
              <Row gap={4} align="center">
                <Briefcase size={20} color="#22c55e" />
                <Text color="gray">
                  {jobsCount} {jobsCount === 1 ? 'job' : 'jobs'}
                </Text>
              </Row>
            )}
            {(organization as { employee_count_range?: string }).employee_count_range && (
              <Row gap={4} align="center">
                <Text color="gray">
                  {(organization as { employee_count_range?: string }).employee_count_range}
                </Text>
              </Row>
            )}
          </Row>
        </Stack>
      ) : null}
    </ViewWithMouse>
  )
}
