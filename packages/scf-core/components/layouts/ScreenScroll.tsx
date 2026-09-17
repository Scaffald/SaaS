import type { ReactElement, ReactNode } from 'react'
import { Platform, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useBottomBarContext } from '@scaffald/ui'

/**
 * Makes a navigator screen scroll on a phone.
 *
 * On web the document scrolls, so a screen whose root is a plain `Stack`
 * reaches all of its content. On native nothing scrolls unless the screen
 * puts a ScrollView in its own tree, and fourteen Office screens never did
 * (#796): the storage table, the payment and transaction reports, the
 * project and team forms, the developer portal, and every loading/error
 * branch of the screens that do scroll sat below the fold with no way down.
 *
 * Rather than a ScrollView per screen, the Office stack wraps every screen
 * in this via the navigator's `screenLayout`, so a new screen scrolls
 * without anyone remembering to add one.
 *
 * Nesting: a screen that already scrolls (DashboardLayout, OfficeLayout, a
 * root ScrollView) ends up inside this one. Yoga sizes the inner scroller to
 * its content, so the outer one does the scrolling and the inner has no
 * overflow; iOS hands the pan gesture to the outer when the inner cannot
 * move. `flexGrow: 1` on the content keeps `flex: 1` screen roots — the
 * common Office root — filling the viewport instead of collapsing to zero.
 *
 * The bottom padding clears the floating bottom nav, same as
 * DashboardLayout does for the worker dashboard.
 *
 * A screen that must own the full height (a map, a virtualized list) can
 * opt out with `<Stack.Screen layout={({ children }) => children} />`, which
 * overrides the navigator-level `screenLayout` for that screen only.
 */
export function shouldWrapScreenInScroll(platformOS: string): boolean {
  return platformOS !== 'web'
}

export function ScreenScroll({ children }: { children: ReactNode }): ReactElement {
  if (!shouldWrapScreenInScroll(Platform.OS)) {
    return <>{children}</>
  }
  return <NativeScreenScroll>{children}</NativeScreenScroll>
}

function NativeScreenScroll({ children }: { children: ReactNode }): ReactElement {
  const insets = useSafeAreaInsets()
  const { navBarHeight } = useBottomBarContext()
  const paddingBottom = navBarHeight > 0 ? navBarHeight + insets.bottom : insets.bottom

  return (
    <ScrollView
      testID="screen-scroll"
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  )
}

/**
 * Drop-in for a navigator's `screenLayout` prop.
 */
export function scrollingScreenLayout({ children }: { children: ReactNode }): ReactElement {
  return <ScreenScroll>{children}</ScreenScroll>
}
