import { MarketingNav, TermsScreen } from '@scf/core/features/marketing'
import type { GenerateMetadataFunction } from 'expo-server'
import { View } from 'react-native'
import { SITE_ORIGIN } from '../../utils/public-content-loader'
import { OG_IMAGE } from '../../utils/og'

export const generateMetadata: GenerateMetadataFunction = () => ({
  title: 'Terms of Service | Scaffald',
  description:
    'The terms governing your use of Scaffald — accounts, acceptable use, content ownership, and liability.',
  alternates: { canonical: `${SITE_ORIGIN}/terms` },
  openGraph: {
    title: 'Terms of Service',
    description: 'The terms governing your use of Scaffald.',
    url: `${SITE_ORIGIN}/terms`,
    siteName: 'Scaffald',
    images: OG_IMAGE,
  },
})

export default function TermsRoute() {
  return (
    <View style={{ flex: 1 }}>
      <MarketingNav />
      <TermsScreen />
    </View>
  )
}
