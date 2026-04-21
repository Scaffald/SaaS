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

function getStrengthLabel(pct: number): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (pct >= 80) return 'Advanced'
  if (pct >= 50) return 'Intermediate'
  return 'Beginner'
}

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
  const completionPct = completionData?.completionPercentage ?? 0
  const strengthLabel = getStrengthLabel(completionPct)

  const strengthBadge =
    completionPct >= 80
      ? { bg: colors.emerald[100], text: colors.emerald[700] }
      : completionPct >= 50
        ? { bg: colors.indigo[50], text: colors.indigo[700] }
        : { bg: colors.amber[100], text: colors.amber[700] }

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
          <Row gap={8} align="center">
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: colors.text[theme].primary,
              }}
            >
              Profile Strength
            </Text>
            <Stack
              paddingHorizontal={8}
              paddingVertical={2}
              borderRadius={6}
              style={{ backgroundColor: strengthBadge.bg }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: strengthBadge.text,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {strengthLabel}
              </Text>
            </Stack>
          </Row>
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

        <ProgressBarBase value={completionPct} color="primary" />
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
