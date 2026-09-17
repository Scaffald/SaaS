import { PrivacyScreen } from '@scf/core/features/marketing'
import type { GenerateMetadataFunction } from 'expo-server'
import { View } from 'react-native'
import { SITE_ORIGIN } from '../../utils/public-content-loader'
import { OG_IMAGE } from '../../utils/og'
import { viewportLoader } from '../../utils/server-viewport'

/** No data of its own; the loader exists so the server lays the page out for the visitor's device (#782). */
export const loader = viewportLoader

export const generateMetadata: GenerateMetadataFunction = () => ({
  title: 'Privacy Policy | Scaffald',
  description:
    'How Scaffald collects, uses, and protects your personal information, and the choices you have over your data.',
  alternates: { canonical: `${SITE_ORIGIN}/privacy` },
  openGraph: {
    title: 'Privacy Policy',
    description: 'How Scaffald collects, uses, and protects your personal information.',
    url: `${SITE_ORIGIN}/privacy`,
    siteName: 'Scaffald',
    images: OG_IMAGE,
  },
})

export default function PrivacyRoute() {
  return (
    <View style={{ flex: 1 }}>
      <PrivacyScreen />
    </View>
  )
}
