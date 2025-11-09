import { YStack, XStack, Text, Button, Card, Avatar, Spinner } from 'tamagui'
import { MapPin, X, ExternalLink, User } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { api } from '@app/core/utils/api'
import { RouteBuilder } from '@app/core/constants/routes'
import { getStorageUrl } from '@app/core/utils/supabase/storage'

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
  const toast = useToastController()

  // Fetch lightweight preview data
  const { data: preview, isLoading } = api.userProfile.getPreview.useQuery(
    { userId: userId || '' },
    { enabled: !!userId && open },
  )

  if (!open || !userId) {
    return null
  }

  const handleViewProfile = () => {
    if (!userId) return

    try {
      router.push(RouteBuilder.discoverWorkerDetail(userId))
      onOpenChange(false)
    } catch (navigationError) {
      console.error('Failed to navigate to worker profile', navigationError)
      toast.show('Unable to load profile', {
        message: 'Please try again.',
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
      p="$4"
      gap="$3"
      minW={280}
      maxW={320}
      bg="$background"
      animation="quick"
      enterStyle={{ opacity: 0, scale: 0.95, y: -10 }}
      exitStyle={{ opacity: 0, scale: 0.95, y: -10 }}
    >
      {/* Close button */}
      <XStack justify="flex-end">
        <Button
          size="$2"
          circular
          chromeless
          icon={X}
          onPress={handleClose}
          opacity={0.7}
          hoverStyle={{ opacity: 1 }}
        />
      </XStack>

      {isLoading ? (
        <YStack py="$4" items="center" gap="$3">
          <Spinner size="small" color="$blue10" />
          <Text fontSize="$3" color="$color11">
            Loading...
          </Text>
        </YStack>
      ) : !preview ? (
        <YStack py="$4" items="center">
          <Text fontSize="$3" color="$red10">
            Profile not found
          </Text>
        </YStack>
      ) : (
        <>
          {/* Profile Header */}
          <XStack gap="$3" items="flex-start">
            {/* Avatar */}
            {avatarUrl ? (
              <Avatar circular size="$4">
                <Avatar.Image source={{ uri: avatarUrl }} />
                <Avatar.Fallback bg="$color3">
                  <User size={24} color="$color10" />
                </Avatar.Fallback>
              </Avatar>
            ) : (
              <Avatar circular size="$4" bg="$color3">
                <User size={24} color="$color10" />
              </Avatar>
            )}

            {/* Name and Title */}
            <YStack flex={1} gap="$1">
              <Text fontSize="$5" fontWeight="600" color="$color12" numberOfLines={1}>
                {preview.displayName}
              </Text>
              {preview.headline && (
                <Text fontSize="$3" color="$color11" numberOfLines={2}>
                  {preview.headline}
                </Text>
              )}
              {preview.location && (
                <XStack gap="$1" items="center" mt="$1">
                  <MapPin size={14} color="$color10" />
                  <Text fontSize="$2" color="$color10" numberOfLines={1}>
                    {preview.location}
                  </Text>
                </XStack>
              )}
            </YStack>
          </XStack>

          {/* Top Skills */}
          {topSkills.length > 0 && (
            <YStack gap="$2">
              <Text fontSize="$2" fontWeight="600" color="$color11" textTransform="uppercase">
                Top Skills
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                {topSkills.slice(0, 3).map((skill) => (
                  <YStack
                    key={skill.csiSkillId || skill.onetOccupationId || skill.taxonomy}
                    bg="$color3"
                    px="$2"
                    py="$1"
                    rounded="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Text fontSize="$2" color="$color11">
                      Skill {skill.proficiency > 0 ? `(${skill.proficiency})` : ''}
                    </Text>
                  </YStack>
                ))}
                {topSkills.length > 3 && (
                  <YStack
                    bg="$color3"
                    px="$2"
                    py="$1"
                    rounded="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Text fontSize="$2" color="$color11">
                      +{topSkills.length - 3} more
                    </Text>
                  </YStack>
                )}
              </XStack>
            </YStack>
          )}

          {/* Action Button */}
          <XStack gap="$2" pt="$2">
            <Button
              flex={1}
              theme="info"
              onPress={handleViewProfile}
              icon={ExternalLink}
            >
              View Profile
            </Button>
          </XStack>
        </>
      )}
    </Card>
  )
}

