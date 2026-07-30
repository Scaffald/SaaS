import { Platform } from 'react-native'
import type { PublicProfile } from '../utils/public-content-loader'

type ProfileJsonLdProps = {
  profile: PublicProfile
  /** Full canonical URL for this profile. */
  canonicalUrl: string
  description: string
}

/**
 * Schema.org ProfilePage/Person JSON-LD for public profiles.
 *
 * Rendered inside the route tree (rather than via generateMetadata, which can
 * only emit <meta>) so the script tag lands in the server-rendered HTML.
 * Web-only; a no-op on native.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/profile-page
 */
export function ProfileJsonLd({ profile, canonicalUrl, description }: ProfileJsonLdProps) {
  if (Platform.OS !== 'web') return null

  const name = profile.full_name || profile.username || 'Profile'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name,
      ...(profile.username ? { alternateName: profile.username } : {}),
      description,
      url: canonicalUrl,
      ...(profile.avatar_url ? { image: profile.avatar_url } : {}),
      ...(profile.current_position ? { jobTitle: profile.current_position } : {}),
      ...(profile.location
        ? { address: { '@type': 'PostalAddress', addressLocality: profile.location } }
        : {}),
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
