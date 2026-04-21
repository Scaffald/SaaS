import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useProfileCompletion } from '@scf/core/features/dashboard/completion/useProfileCompletion'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { openPublicProfileInNewTab } from '@scf/core/utils/publicProfileUrl'
import {
  Avatar,
  DashboardWidget,
  ProgressBarBase,
  Row,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import {
  Briefcase,
  ClipboardCheck,
  FileText,
  Users,
  type LucideIcon,
} from 'lucide-react-native'
import { Pressable, ScrollView } from 'react-native'

type QuickAction = {
  label: string
  icon: LucideIcon
  route: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Find Jobs', icon: Briefcase, route: buildPath(ROUTES.JOBS, {}) },
  { label: 'My Resume', icon: FileText, route: buildPath(ROUTES.PROFILE.RESUME, {}) },
  { label: 'Assessments', icon: ClipboardCheck, route: ROUTES.ASSESSMENTS.path },
  { label: 'Teams', icon: Users, route: ROUTES.EMPLOYERS.TEAMS.path },
]

export function ProfileHero() {
  const { theme } = useThemeContext()
  const { data } = useGeneralInfoWidget()
  const { completionData } = useProfileCompletion()
  const router = useRouter()

  const firstName = data?.privateData?.first_name
  const lastName = data?.privateData?.last_name
  const fullName =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : data?.display_name ?? data?.username ?? 'Your profile'
  const avatarUrl = data?.avatar_url ?? data?.avatar_path
  const initials =
    fullName
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  const slug = data?.slug
  const isVerified = data?.idVerificationBadge?.badge_status === 'active'
  const rawCompletionPct = completionData?.completionPercentage ?? 0

  // Baseline credit for signals the user has already provided just by having an
  // account — so the meter never shows 0% when the profile is clearly started.
  const hasName =
    !!(firstName && lastName) ||
    (!!data?.display_name && data.display_name !== 'Your profile')
  const hasAvatar = !!avatarUrl
  const baselinePct =
    5 + // account exists (we wouldn't be rendering otherwise)
    (hasName ? 5 : 0) +
    (hasAvatar ? 5 : 0) +
    (isVerified ? 5 : 0)
  const completionPct = Math.min(100, Math.max(rawCompletionPct, baselinePct))

  return (
    <DashboardWidget>
      <Row gap={16} align="center" wrap>
        <Avatar
          size={72}
          src={avatarUrl ?? undefined}
          initials={initials}
          verified={isVerified}
          color="gray"
          alt={fullName}
        />
        <Stack gap={8} flex={1} minWidth={160}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.text[theme].primary,
            }}
            numberOfLines={1}
          >
            {fullName}
          </Text>
          <Row gap={16}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: colors.text[theme].primary,
              }}
              onPress={() => router.push(ROUTES.PROFILE.path)}
            >
              Edit profile
            </Text>
            {slug ? (
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.primary[600],
                }}
                onPress={() => openPublicProfileInNewTab(slug)}
              >
                View Profile
              </Text>
            ) : null}
          </Row>
        </Stack>
      </Row>

      <Stack
        gap={12}
        padding={16}
        borderRadius={12}
        style={{
          backgroundColor: colors.bg[theme].subtle,
          borderWidth: 1,
          borderColor: colors.border[theme].ghost,
        }}
      >
        <Row justify="space-between" align="center">
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: colors.text[theme].primary,
            }}
          >
            Profile Strength
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color:
                completionPct >= 80
                  ? colors.emerald[700]
                  : colors.text[theme].primary,
            }}
          >
            {completionPct}% Complete
          </Text>
        </Row>

        <ProgressBarBase
          value={completionPct}
          color="primary"
          style={{ backgroundColor: colors.bg[theme].muted }}
        />
      </Stack>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {QUICK_ACTIONS.map(({ label, icon: Icon, route }) => (
          <Pressable
            key={label}
            onPress={() => router.push(route)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: colors.bg[theme].default,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: colors.border[theme].default,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Icon size={16} color={colors.icon[theme].default} />
            <Text
              size="xs"
              weight="semibold"
              style={{ color: colors.text[theme].primary }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </DashboardWidget>
  )
}
