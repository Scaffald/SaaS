import { RouteBuilder } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { getStorageUrl } from '@app/core/utils/supabase/storage'
import { Briefcase, Building2, ExternalLink, MapPin, User } from '@tamagui/lucide-icons'
import { Button, Spinner, Text, View, XStack, YStack } from 'tamagui'

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
  const { data: workerPreview, isLoading: isLoadingWorker } = api.userProfile.getPreview.useQuery(
    { userId: pinId || '' },
    { enabled: !!pinId && pinType === 'worker' && visible }
  )

  // Fetch organization data
  const { data: organization, isLoading: isLoadingOrg } =
    api.organizations.getOrganization.useQuery(
      { id: pinId || '' },
      { enabled: !!pinId && pinType === 'organization' && visible }
    )

  // Fetch open jobs count for organizations
  const { data: jobsCount = 0 } = api.organizations.getOpenJobsCount.useQuery(
    { organizationId: pinId || '' },
    { enabled: !!pinId && pinType === 'organization' && visible }
  )

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
      ? RouteBuilder.discoverWorkerDetail(pinId)
      : pinType === 'organization'
        ? RouteBuilder.dashboardEmployer(pinId)
        : null

  const handleOpenProfile = () => {
    if (!profileUrl) {
      return
    }
    if (typeof window !== 'undefined') {
      window.open(profileUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <View
      position="absolute"
      bg="$background"
      borderColor="$color6"
      borderWidth={1}
      rounded="$4"
      p="$3"
      minW={240}
      maxW={300}
      style={{
        zIndex: 1000,
        transform: 'translate(-50%, calc(-100% - 4px))',
        top: position?.y ?? 0,
        left: position?.x ?? 0,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        pointerEvents: 'auto',
      }}
      onMouseEnter={onHoverCardEnter}
      onMouseLeave={onHoverCardLeave}
    >
      {isLoading ? (
        <YStack items="center" py="$4" gap="$2">
          <Spinner size="small" color="$blue10" />
          <Text fontSize="$3" color="$color11">
            Loading...
          </Text>
        </YStack>
      ) : pinType === 'worker' && workerPreview ? (
        <YStack gap="$2">
          {/* Header with avatar and name */}
          <XStack gap="$3" items="center">
            {avatarUrl ? (
              <View width={48} height={48} rounded="$10" overflow="hidden" bg="$color3">
                <img
                  src={avatarUrl}
                  alt={workerPreview.displayName || 'Worker'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </View>
            ) : (
              <View
                width={48}
                height={48}
                rounded="$10"
                bg="$blue4"
                items="center"
                justify="center"
              >
                <User size={24} color="$blue10" />
              </View>
            )}
            <YStack flex={1} gap="$1">
              <Text fontSize="$5" fontWeight="600" color="$color12" numberOfLines={1}>
                {workerPreview.displayName}
              </Text>
              {workerPreview.headline && (
                <Text fontSize="$3" color="$color11" numberOfLines={1}>
                  {workerPreview.headline}
                </Text>
              )}
            </YStack>
            {profileUrl ? (
              <Button
                size="$2"
                circular
                variant="outlined"
                icon={ExternalLink}
                aria-label="View full profile in new tab"
                onPress={handleOpenProfile}
              />
            ) : null}
          </XStack>

          {/* Location */}
          {workerPreview.location && (
            <XStack gap="$2" items="center">
              <MapPin size={14} color="$color10" />
              <Text fontSize="$3" color="$color11" numberOfLines={1}>
                {workerPreview.location}
              </Text>
            </XStack>
          )}

          {/* Top Skills */}
          {workerPreview.topSkills && workerPreview.topSkills.length > 0 && (
            <XStack gap="$1" flexWrap="wrap">
              {workerPreview.topSkills
                .slice(0, 3)
                .map((skill: (typeof workerPreview.topSkills)[0]) => {
                  const skillKey =
                    skill.csiSkillId ||
                    skill.onetOccupationId ||
                    skill.taxonomy ||
                    `skill-${Math.random()}`
                  return (
                    <View key={skillKey} bg="$blue4" px="$2" py="$1" rounded="$2">
                      <Text fontSize="$1" color="$blue11">
                        {skill.taxonomy || 'Skill'}
                      </Text>
                    </View>
                  )
                })}
              {workerPreview.topSkills.length > 3 && (
                <Text fontSize="$1" color="$color10">
                  +{workerPreview.topSkills.length - 3} more
                </Text>
              )}
            </XStack>
          )}
        </YStack>
      ) : pinType === 'organization' && organization ? (
        <YStack gap="$2">
          {/* Header with icon and name */}
          <XStack gap="$3" items="center">
            <View width={48} height={48} rounded="$6" bg="$blue4" items="center" justify="center">
              <Building2 size={24} color="$blue10" />
            </View>
            <YStack flex={1} gap="$1">
              <Text fontSize="$5" fontWeight="600" color="$color12" numberOfLines={1}>
                {organization.name}
              </Text>
              {organization.industry_name && (
                <Text fontSize="$3" color="$color11" numberOfLines={1}>
                  {organization.industry_name}
                </Text>
              )}
            </YStack>
            {profileUrl ? (
              <Button
                size="$2"
                circular
                variant="outlined"
                icon={ExternalLink}
                aria-label="View organization in new tab"
                onPress={handleOpenProfile}
              />
            ) : null}
          </XStack>

          {/* Location */}
          {organization.address &&
            typeof organization.address === 'object' &&
            'city' in organization.address && (
              <XStack gap="$2" items="center">
                <MapPin size={14} color="$color10" />
                <Text fontSize="$3" color="$color11" numberOfLines={1}>
                  {[
                    (organization.address as { city?: string }).city,
                    (organization.address as { state?: string }).state,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </XStack>
            )}

          {/* Key Metrics */}
          <XStack gap="$3" flexWrap="wrap">
            {jobsCount > 0 && (
              <XStack gap="$1" items="center">
                <Briefcase size={14} color="$green10" />
                <Text fontSize="$2" color="$color11">
                  {jobsCount} {jobsCount === 1 ? 'job' : 'jobs'}
                </Text>
              </XStack>
            )}
            {organization.employee_count_range && (
              <XStack gap="$1" items="center">
                <Text fontSize="$2" color="$color11">
                  {organization.employee_count_range}
                </Text>
              </XStack>
            )}
          </XStack>
        </YStack>
      ) : null}
    </View>
  )
}
