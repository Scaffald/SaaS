import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { getStorageUrl } from '@scf/core/utils/supabase/storage'
import { ExternalLink, MapPin, User, X } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { Avatar, Button, Card, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

type PreviewSkill = {
  csiSkillId?: string | null
  onetOccupationId?: string | null
  taxonomy?: string | null
  proficiency: number
}

interface UserProfilePanelProps {
  /** User ID to display */
  userId: string | null
  /** Whether the panel is open */
  open: boolean
  /** Callback when panel open state changes */
  onOpenChange: (open: boolean) => void
  /** Position of the panel (for positioning relative to map pin) */
  position?: { top?: number; bottom?: number; left?: number; right?: number }
}

/**
 * UserProfilePanel Component
 *
 * Compact profile preview panel for map view overlay.
 * Shows user avatar, name, title, location, and top skills.
 * Positioned as an overlay on the map (not blocking map view).
 */
export function UserProfilePanel({
  userId,
  open,
  onOpenChange,
  position = { top: 16, right: 16 },
}: UserProfilePanelProps) {
  const router = useRouter()
  const toast = useToast()

  // Fetch lightweight preview data
  const { data: preview, isLoading } = api.userProfile.getPreview.useQuery(
    { userId: userId || '' },
    { enabled: !!userId && open }
  )

  if (!open || !userId) {
    return null
  }

  const handleViewProfile = () => {
    if (!userId) return

    try {
      router.push(buildPath(ROUTES.DASHBOARD.DISCOVER.WORKERS.DETAIL, { id: userId }))
      onOpenChange(false)
    } catch (navigationError) {
      console.error('Failed to navigate to worker profile', navigationError)
      toast.show({
          title: 'Unable to load profile',
          message: 'Please try again.',
          variant: 'error',
        })
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  // Get avatar URL
  const avatarUrl = preview?.avatarPath
    ? getStorageUrl('avatars', preview.avatarPath)
    : preview?.avatarUrl || null
  const topSkills = (preview?.topSkills ?? []) as PreviewSkill[]

  return (
    <Card
      position="absolute"
      {...position}
      zIndex={1000}
      elevate
      bordered
      padding="$4"
      gap="$3"
      minWidth={280}
      maxWidth={320}
      backgroundColor="$background"
      animation="quick"
      enterStyle={{ opacity: 0, scale: 0.95, y: -10 }}
      exitStyle={{ opacity: 0, scale: 0.95, y: -10 }}
    >
      {/* Close button */}
      <Row justifyContent="flex-end">
        <Button
          size="$2"
          circular
          chromeless
          icon={X}
          onPress={handleClose}
          opacity={0.7}
          hoverStyle={{ opacity: 1 }}
        />
      </Row>

      {isLoading ? (
        <Stack paddingVertical="$4" alignItems="center" gap="$3">
          <Spinner size="small" color="$blue10" />
          <Text fontSize="$3" color="$color11">
            Loading...
          </Text>
        </Stack>
      ) : !preview ? (
        <Stack paddingVertical="$4" alignItems="center">
          <Text fontSize="$3" color="$red10">
            Profile not found
          </Text>
        </Stack>
      ) : (
        <>
          {/* Profile Header */}
          <Row gap="$3" alignItems="flex-start">
            {/* Avatar */}
            {avatarUrl ? (
              <Avatar circular size="$4">
                <Avatar.Image source={{ uri: avatarUrl }} />
                <Avatar.Fallback backgroundColor="$color3">
                  <User size={24} color="$color10" />
                </Avatar.Fallback>
              </Avatar>
            ) : (
              <Avatar circular size="$4" backgroundColor="$color3">
                <User size={24} color="$color10" />
              </Avatar>
            )}

            {/* Name and Title */}
            <Stack flex={1} gap="$1">
              <Text fontSize="$5" fontWeight="600" color="$color12" numberOfLines={1}>
                {preview.displayName}
              </Text>
              {preview.headline && (
                <Text fontSize="$3" color="$color11" numberOfLines={2}>
                  {preview.headline}
                </Text>
              )}
              {preview.location && (
                <Row gap="$1" alignItems="center" marginTop="$1">
                  <MapPin size={14} color="$color10" />
                  <Text fontSize="$2" color="$color10" numberOfLines={1}>
                    {preview.location}
                  </Text>
                </Row>
              )}
            </Stack>
          </Row>

          {/* Top Skills */}
          {topSkills.length > 0 && (
            <Stack gap="$2">
              <Text fontSize="$2" fontWeight="600" color="$color11" textTransform="uppercase">
                Top Skills
              </Text>
              <Row gap="$2" flexWrap="wrap">
                {topSkills.slice(0, 3).map((skill) => (
                  <Stack
                    key={skill.csiSkillId || skill.onetOccupationId || skill.taxonomy}
                    backgroundColor="$color3"
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Text fontSize="$2" color="$color11">
                      Skill {skill.proficiency > 0 ? `(${skill.proficiency})` : ''}
                    </Text>
                  </Stack>
                ))}
                {topSkills.length > 3 && (
                  <Stack
                    backgroundColor="$color3"
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Text fontSize="$2" color="$color11">
                      +{topSkills.length - 3} more
                    </Text>
                  </Stack>
                )}
              </Row>
            </Stack>
          )}

          {/* Action Button */}
          <Row gap="$2" paddingTop="$2">
            <Button flex={1} theme="info" onPress={handleViewProfile} icon={ExternalLink}>
              View Profile
            </Button>
          </Row>
        </>
      )}
    </Card>
  )
}
