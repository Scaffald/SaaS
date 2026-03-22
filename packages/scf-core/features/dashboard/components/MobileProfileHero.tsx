import { ROUTES } from '@scf/core/constants/routes'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { useProfileCompletion } from '@scf/core/features/dashboard/completion/useProfileCompletion'
import { Avatar, Row, Stack, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { Pressable, View } from 'react-native'

export function MobileProfileHero() {
  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const { data } = useGeneralInfoWidget()
  const { completionData } = useProfileCompletion()
  const router = useRouter()

  if (!isMobile) return null

  const firstName = data?.privateData?.first_name ?? 'there'
  const displayName = data?.display_name ?? firstName
  const headline = data?.headline
  const avatarUrl = data?.avatar_url ?? data?.avatar_path
  const initials = firstName.charAt(0).toUpperCase()
  const isVerified = data?.idVerificationBadge?.badge_status === 'active'
  const completionPct = completionData?.completionPercentage ?? 0

  return (
    <Pressable
      onPress={() => router.push(ROUTES.PROFILE.path)}
      style={{
        backgroundColor: colors.bg[theme].default,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border[theme].subtle,
      }}
    >
      <Row gap={16} style={{ alignItems: 'center' }}>
        {/* Avatar with completion ring */}
        <View>
          <Avatar
            size={64}
            src={avatarUrl ?? undefined}
            initials={initials}
            verified={isVerified}
            showRing
            color="primary"
            alt={displayName}
          />
          {/* Completion percentage overlay */}
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              backgroundColor: colors.primary[500],
              borderRadius: 10,
              paddingHorizontal: 6,
              paddingVertical: 2,
              minWidth: 28,
              alignItems: 'center',
            }}
          >
            <Text
              size="xs"
              weight="bold"
              style={{ color: '#ffffff', fontSize: 10 }}
            >
              {completionPct}%
            </Text>
          </View>
        </View>

        {/* Name + headline */}
        <Stack gap={4} style={{ flex: 1 }}>
          <Text size="lg" weight="bold" style={{ color: colors.text[theme].primary }}>
            Welcome, {firstName}
          </Text>
          {headline ? (
            <Text
              size="sm"
              style={{ color: colors.text[theme].secondary }}
              numberOfLines={1}
            >
              {headline}
            </Text>
          ) : (
            <Text size="sm" style={{ color: colors.text[theme].tertiary }}>
              Tap to complete your profile
            </Text>
          )}
        </Stack>

        <ChevronRight size={20} color={colors.icon[theme].muted} />
      </Row>

      {/* Completion progress bar */}
      <View style={{ marginTop: 16 }}>
        <View
          style={{
            height: 4,
            backgroundColor: colors.bg[theme].muted,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${completionPct}%`,
              backgroundColor: colors.primary[500],
              borderRadius: 2,
            }}
          />
        </View>
      </View>
    </Pressable>
  )
}
