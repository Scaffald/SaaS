import { ContactSection, MarketingFooter, MarketingNav } from '@scf/core/features/marketing'
import type { GenerateMetadataFunction } from 'expo-server'
import { ScrollView, View } from 'react-native'
import { SITE_ORIGIN } from '../../utils/public-content-loader'
import { OG_IMAGE } from '../../utils/og'

export const generateMetadata: GenerateMetadataFunction = () => ({
  title: 'Contact Us | Scaffald',
  description:
    'Tell us about your organization and we will be in touch. Scaffald is modern hiring for technical trades.',
  alternates: { canonical: `${SITE_ORIGIN}/contact` },
  openGraph: {
    title: 'Contact Scaffald',
    description: 'Tell us about your organization and we will be in touch.',
    url: `${SITE_ORIGIN}/contact`,
    siteName: 'Scaffald',
    images: OG_IMAGE,
  },
})

export default function ContactRoute() {
  return (
    <View style={{ flex: 1 }}>
      <MarketingNav />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <ContactSection headingLevel={1} />
        <MarketingFooter />
      </ScrollView>
    </View>
  )
}
