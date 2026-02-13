import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useUserProfilePreview } from '@scf/core/utils/user-profiles-sdk-hooks'
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
  const { data: preview, isLoading } = useUserProfilePreview(userId, {
    enabled: open,
  })

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
      padding={16}
      gap={12}
      minWidth={280}
      maxWidth={320}
      backgroundColor="$background"
      animation="quick"
      enterStyle={{ opacity: 0, scale: 0.95, y: -10 }}
      exitStyle={{ opacity: 0, scale: 0.95, y: -10 }}
    >
      {/* Close button */}
      <Row justify="flex-end">
        <Button
          size={8}
          circular
          chromeless
          icon={X}
          onPress={handleClose}
          opacity={0.7}
          hoverStyle={{ opacity: 1 }}
        />
      </Row>

      {isLoading ? (
        <Stack paddingVertical={16} align="center" gap={12}>
          <Spinner size="sm" color="$blue10" />
          <Text color="gray">Loading...</Text>
        </Stack>
      ) : !preview ? (
        <Stack paddingVertical={16} align="center">
          <Text color="$red10">Profile not found</Text>
        </Stack>
      ) : (
        <>
          {/* Profile Header */}
          <Row gap={12} align="flex-start">
            {/* Avatar */}
            {avatarUrl ? (
              <Avatar circular size={16}>
                <Avatar.Image source={{ uri: avatarUrl }} />
                <Avatar.Fallback backgroundColor="$color3">
                  <User size={24} color="gray" />
                </Avatar.Fallback>
              </Avatar>
            ) : (
              <Avatar circular size={16} backgroundColor="$color3">
                <User size={24} color="gray" />
              </Avatar>
            )}

            {/* Name and Title */}
            <Stack flex={1} gap={4}>
              <Text color="gray" numberOfLines={1}>
                {preview.displayName}
              </Text>
              {preview.headline && (
                <Text color="gray" numberOfLines={2}>
                  {preview.headline}
                </Text>
              )}
              {preview.location && (
                <Row gap={4} align="center" marginTop={4}>
                  <MapPin size={14} color="gray" />
                  <Text color="gray" numberOfLines={1}>
                    {preview.location}
                  </Text>
                </Row>
              )}
            </Stack>
          </Row>

          {/* Top Skills */}
          {topSkills.length > 0 && (
            <Stack gap={8}>
              <Text color="gray" textTransform="uppercase">
                Top Skills
              </Text>
              <Row gap={8} flexWrap="wrap">
                {topSkills.slice(0, 3).map((skill) => (
                  <Stack
                    key={skill.csiSkillId || skill.onetOccupationId || skill.taxonomy}
                    backgroundColor="$color3"
                    paddingHorizontal={8}
                    paddingVertical={4}
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Text color="gray">
                      Skill {skill.proficiency > 0 ? `(${skill.proficiency})` : ''}
                    </Text>
                  </Stack>
                ))}
                {topSkills.length > 3 && (
                  <Stack
                    backgroundColor="$color3"
                    paddingHorizontal={8}
                    paddingVertical={4}
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Text color="gray">+{topSkills.length - 3} more</Text>
                  </Stack>
                )}
              </Row>
            </Stack>
          )}

          {/* Action Button */}
          <Row gap={8} paddingTop={8}>
            <Button flex={1} theme="info" onPress={handleViewProfile} icon={ExternalLink}>
              View Profile
            </Button>
          </Row>
        </>
      )}
    </Card>
  )
}
