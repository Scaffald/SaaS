// Imported from the content module rather than the barrel so the JSON-LD does
// not depend on the component graph.
import { FAQ_TABS } from '@scf/core/features/marketing/content/faq'
import { Platform } from 'react-native'
import { SITE_ORIGIN } from '../utils/public-content-loader'

/**
 * Organization + WebSite + FAQPage structured data for the landing page.
 *
 * Lives in the route tree rather than generateMetadata, which can only emit
 * <meta> tags. Web-only; a no-op on native.
 */
export function MarketingJsonLd() {
  if (Platform.OS !== 'web') return null

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Scaffald',
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/favicon.ico`,
    description:
      'Scaffald is a talent platform connecting skilled trade workers with employers across the construction industry.',
    sameAs: ['https://www.linkedin.com/company/scaffald/'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'hello@scaffald.com',
      url: `${SITE_ORIGIN}/support`,
    },
  }

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Scaffald',
    url: SITE_ORIGIN,
  }

  // Flatten every FAQ tab — the tabs are a UI affordance, not separate pages.
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: Object.values(FAQ_TABS)
      .flat()
      .map((entry) => ({
        '@type': 'Question',
        name: entry.q,
        acceptedAnswer: { '@type': 'Answer', text: entry.a },
      })),
  }

  return (
    <>
      {[organization, website, faq].map((schema) => (
        <script
          key={schema['@type']}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
