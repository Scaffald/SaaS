import { MarketingNav, SupportScreen } from '@scf/core/features/marketing'
import type { GenerateMetadataFunction } from 'expo-server'
import { View } from 'react-native'
import { SITE_ORIGIN } from '../../utils/public-content-loader'
import { OG_IMAGE } from '../../utils/og'

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
  return (
    <View style={{ flex: 1 }}>
      <MarketingNav />
      <SupportScreen />
    </View>
  )
}
