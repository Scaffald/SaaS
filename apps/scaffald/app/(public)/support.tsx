import { SupportScreen } from '@scf/core/features/marketing'
import { supportRedirectFor } from '@scf/core/features/support/support-route'
import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import type { GenerateMetadataFunction } from 'expo-server'
import { type Href, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { View } from 'react-native'
import { SITE_ORIGIN } from '../../utils/public-content-loader'
import { OG_IMAGE } from '../../utils/og'
import { viewportLoader } from '../../utils/server-viewport'

/** No data of its own; the loader exists so the server lays the page out for the visitor's device (#782). */
export const loader = viewportLoader

export const generateMetadata: GenerateMetadataFunction = () => ({
  title: 'Support | Scaffald',
  description:
    'Get help with your Scaffald account, profile, and job listings — answers to common questions and how to reach us.',
  alternates: { canonical: `${SITE_ORIGIN}/support` },
  openGraph: {
    title: 'Support',
    description: 'Get help with your Scaffald account, profile, and job listings.',
    url: `${SITE_ORIGIN}/support`,
    siteName: 'Scaffald',
    images: OG_IMAGE,
  },
})

export default function SupportRoute() {
  const router = useRouter()
  const { session, isLoading } = useSessionContext()
  const redirect = supportRedirectFor({ hasSession: !!session, isLoadingSession: isLoading })

  // A signed-in user gets Support inside the app shell (#1213). The move
  // happens after mount, from the screen rather than the (public) layout, so
  // the server render and hydration stay the public page and the layout's
  // navigator is never swapped out.
  useEffect(() => {
    if (redirect) router.replace(redirect as Href)
  }, [redirect, router])

  return (
    <View style={{ flex: 1 }}>
      <SupportScreen />
    </View>
  )
}
