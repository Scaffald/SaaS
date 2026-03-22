import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useUserProfilePreview } from '@scf/core/utils/user-profiles-sdk-hooks'
import { getStorageUrl } from '@scf/core/utils/supabase/storage'
import { ExternalLink, MapPin, User, X } from 'lucide-react-native'
import { useThemeContext, useToast } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { Avatar, Button, Card, Spinner, Text, Row, Stack } from '@scaffald/ui'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light' as const

  // Fetch lightweight preview data
  const { data: preview, isLoading } = useUserProfilePreview(userId ?? undefined, {
    enabled: open,
  })

  if (!open || !userId) {
    return null
  }

  const handleViewProfile = () => {
    if (!userId) return

    try {
      router.push(buildPath(ROUTES.WORKERS.DETAIL, { id: userId }))
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
      elevate
      bordered
      padding="md"
      style={{
        position: 'absolute',
        ...position,
        zIndex: 1000,
        minWidth: 280,
        maxWidth: 320,
      }}
    >
      {/* Close button */}
      <Stack gap={12}>
      <Row justify="flex-end">
        <Button size="sm" variant="outline" iconStart={X} onPress={handleClose} />
      </Row>

      {isLoading ? (
        <Stack paddingVertical={16} align="center" gap={12}>
          <Spinner variant="ios" size="sm" color="primary" />
          <Text color="secondary">Loading...</Text>
        </Stack>
      ) : !preview ? (
        <Stack paddingVertical={16} align="center">
          <Text color="error">Profile not found</Text>
        </Stack>
      ) : (
        <>
          {/* Profile Header */}
          <Row gap={12} align="flex-start">
            {/* Avatar */}
            {avatarUrl ? (
              <Avatar size={40} src={{ uri: avatarUrl }} alt={preview.displayName} />
            ) : (
              <Avatar size={40} icon={<User size={24} color="#737373" />} />
            )}

            {/* Name and Title */}
            <Stack flex={1} gap={4}>
              <Text style={{ color: colors.text[t].secondary }}>{preview.displayName}</Text>
              {preview.headline && <Text style={{ color: colors.text[t].secondary }}>{preview.headline}</Text>}
              {preview.location && (
                <Row gap={4} align="center" marginTop={4}>
                  <MapPin size="md" color={colors.text[t].secondary} />
                  <Text style={{ color: colors.text[t].secondary }}>{preview.location}</Text>
                </Row>
              )}
            </Stack>
          </Row>

          {/* Top Skills */}
          {topSkills.length > 0 && (
            <Stack gap={8}>
              <Text color="secondary" style={{ textTransform: 'uppercase' }}>
                Top Skills
              </Text>
              <Row gap={8} wrap>
                {topSkills.slice(0, 3).map((skill) => (
                  <Stack
                    key={skill.csiSkillId || skill.onetOccupationId || skill.taxonomy}
                    style={{ backgroundColor: colors.bg[t].muted, borderColor: colors.border[t].default }}
                    paddingHorizontal={8}
                    paddingVertical={4}
                    borderRadius={12}
                    borderWidth={1}
                  >
                    <Text color="secondary">
                      Skill {skill.proficiency > 0 ? `(${skill.proficiency})` : ''}
                    </Text>
                  </Stack>
                ))}
                {topSkills.length > 3 && (
                  <Stack
                    style={{ backgroundColor: colors.bg[t].muted, borderColor: colors.border[t].default }}
                    paddingHorizontal={8}
                    paddingVertical={4}
                    borderRadius={12}
                    borderWidth={1}
                  >
                    <Text color="secondary">+{topSkills.length - 3} more</Text>
                  </Stack>
                )}
              </Row>
            </Stack>
          )}

          {/* Action Button */}
          <Row gap={8} paddingTop={8}>
            <Button
              color="primary"
              onPress={handleViewProfile}
              iconStart={ExternalLink}
              style={{ flex: 1 }}
            >
              View Profile
            </Button>
          </Row>
        </>
      )}
      </Stack>
    </Card>
  )
}
