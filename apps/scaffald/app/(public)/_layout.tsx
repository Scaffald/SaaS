import { MarketingNav } from '@scf/core/features/marketing'
import { Slot } from 'expo-router'
import { Platform, View } from 'react-native'

/**
 * Public Layout — no auth required.
 * Routes here are accessible to anyone (public profiles, public job pages, invitation links).
 *
 * On web every public route gets the site header here rather than mounting it
 * per page, so the next public page inherits navigation and a way to sign in
 * (#762). These are the pages search engines index, so they are where most
 * first-time visitors arrive; without this a job posting reached from a search
 * result was a dead end. The header is signed-out chrome by design — the
 * drawer is account chrome and has no anonymous variant (#756).
 *
 * `sectionBasePath="/"` sends the landing-page section links home; with the
 * default they were bare `#fragment`s that pointed nowhere on these pages.
 *
 * Native keeps its own navigator headers; the marketing header is a web
 * surface.
 */
export default function PublicLayout() {
  if (Platform.OS !== 'web') {
    return <Slot />
  }
  return (
    <View style={{ flex: 1 }}>
      <MarketingNav sectionBasePath="/" />
      <Slot />
    </View>
  )
}
