import { ROUTES } from '@scf/core/constants/routes'
import { MarketingNav } from '@scf/core/features/marketing'
import { useAuthStatus } from '@scf/core/provider/auth/useAuth'
import { EmptyState, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { SearchX } from 'lucide-react-native'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * The page for a URL no route matches (`app/+not-found.tsx`), and for
 * `/_sitemap` outside development (#1082). Without it expo-router served its
 * stock black "Unmatched Route" page, with a link to a sitemap of every route.
 *
 * On web it sits under the site header, like the public pages a stray link
 * most often comes from; the header already adapts to a signed-in visitor.
 * Native has no header, so the content clears the safe area itself.
 *
 * The primary action's label is the same signed in or out so the server and
 * hydration renders agree; only where it goes depends on the session.
 */
export function NotFoundScreen() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const insets = useSafeAreaInsets()
  const { isAuthenticated } = useAuthStatus()
  const canGoBack = router.canGoBack()

  const goHome = () => {
    router.replace(isAuthenticated ? ROUTES.DASHBOARD.path : ROUTES.HOME.path)
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg[t].default }}>
      {Platform.OS === 'web' && <MarketingNav sectionBasePath={ROUTES.HOME.path} />}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <EmptyState
          icon={SearchX}
          title="We couldn't find that page"
          description="The link may be broken, or the page may have moved."
          action={{ label: 'Go to Home', onPress: goHome }}
          secondaryAction={canGoBack ? { label: 'Go back', onPress: () => router.back() } : undefined}
        />
      </View>
    </View>
  )
}
