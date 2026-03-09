import { ROUTES } from '@scf/core/constants/routes'
import { Text, useThemeContext, useResponsive } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { usePathname, useRouter } from 'expo-router'
import { Briefcase, Home, Newspaper, User } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TABS = [
  { label: 'Home', icon: Home, route: ROUTES.DASHBOARD.path },
  { label: 'Jobs', icon: Briefcase, route: ROUTES.DASHBOARD.DISCOVER.JOBS.path },
  { label: 'News', icon: Newspaper, route: ROUTES.DASHBOARD.NEWS.path },
  { label: 'Profile', icon: User, route: ROUTES.DASHBOARD.PROFILE.path },
] as const

export function MobileBottomNav() {
  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const insets = useSafeAreaInsets()
  const pathname = usePathname()
  const router = useRouter()

  if (!isMobile) return null

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56 + insets.bottom,
        paddingBottom: insets.bottom,
        backgroundColor: colors.bg[theme].default,
        borderTopWidth: 1,
        borderTopColor: colors.border[theme].default,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {TABS.map(({ label, icon: Icon, route }) => {
        const isHome = route === ROUTES.DASHBOARD.path
        const isActive = pathname === route || (!isHome && pathname.startsWith(route))
        const iconColor = isActive ? colors.primary[600] : colors.icon[theme].muted
        return (
          <Pressable
            key={route}
            onPress={() => router.push(route)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 8,
              gap: 3,
            }}
          >
            <Icon size={22} color={iconColor} />
            <Text
              size="xs"
              weight={isActive ? 'semibold' : 'regular'}
              style={{ color: iconColor }}
            >
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
