import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { Briefcase, ClipboardCheck, FileText, Users } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { Pressable, ScrollView } from 'react-native'

type QuickAction = {
  label: string
  icon: LucideIcon
  route: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Find Jobs',
    icon: Briefcase,
    route: buildPath(ROUTES.JOBS, {}),
  },
  {
    label: 'My Resume',
    icon: FileText,
    route: buildPath(ROUTES.PROFILE.RESUME, {}),
  },
  {
    label: 'Assessments',
    icon: ClipboardCheck,
    route: ROUTES.ASSESSMENTS.path,
  },
  {
    label: 'Teams',
    icon: Users,
    route: ROUTES.EMPLOYERS.TEAMS.path,
  },
]

export function MobileQuickActions() {
  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const router = useRouter()

  if (!isMobile) return null

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10 }}
    >
      {QUICK_ACTIONS.map(({ label, icon: Icon, route }) => (
          <Pressable
            key={label}
            onPress={() => router.push(route)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: colors.bg[theme].default,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: colors.border[theme].default,
            }}
          >
            <Icon
              size={18}
              color={colors.icon[theme].default}
            />
            <Text
              size="xs"
              weight="semibold"
              style={{
                color: colors.text[theme].primary,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
    </ScrollView>
  )
}
