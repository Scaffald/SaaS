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
  variant: 'dark' | 'surface'
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Find Jobs',
    icon: Briefcase,
    route: buildPath(ROUTES.JOBS, {}),
    variant: 'dark',
  },
  {
    label: 'My Resume',
    icon: FileText,
    route: buildPath(ROUTES.PROFILE.RESUME, {}),
    variant: 'surface',
  },
  {
    label: 'Assessments',
    icon: ClipboardCheck,
    route: ROUTES.ASSESSMENTS.path,
    variant: 'surface',
  },
  {
    label: 'Teams',
    icon: Users,
    route: ROUTES.EMPLOYERS.TEAMS.path,
    variant: 'surface',
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
      {QUICK_ACTIONS.map(({ label, icon: Icon, route, variant }) => {
        const isDark = variant === 'dark'
        return (
          <Pressable
            key={label}
            onPress={() => router.push(route)}
            style={{
              width: 100,
              backgroundColor: isDark
                ? theme === 'dark'
                  ? colors.bg.dark.muted
                  : colors.fg.light.default
                : colors.bg[theme].default,
              borderRadius: 20,
              padding: 14,
              height: 88,
              justifyContent: 'space-between',
              ...(isDark
                ? {}
                : {
                    borderWidth: 1,
                    borderColor: colors.border[theme].default,
                  }),
            }}
          >
            <Icon
              size={20}
              color={isDark ? colors.primary[400] : colors.icon[theme].default}
            />
            <Text
              size="xs"
              weight="semibold"
              style={{
                color: isDark ? '#ffffff' : colors.text[theme].primary,
              }}
            >
              {label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
