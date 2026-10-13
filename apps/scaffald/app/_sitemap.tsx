import { NotFoundScreen } from '@scf/core/components/NotFoundScreen'
import { Sitemap } from 'expo-router'
import type { GenerateMetadataFunction } from 'expo-server'

/**
 * Replaces expo-router's generated `/_sitemap`, which in production listed
 * every route — admin included — with the SDK version (#1082). Development
 * keeps the real sitemap; everywhere else the path is just a page that
 * doesn't exist. (Search-engine sitemaps are the `sitemap*.xml+api.ts` routes.)
 */
export const generateMetadata: GenerateMetadataFunction = () => ({
  title: __DEV__ ? 'Sitemap | Scaffald' : 'Page Not Found | Scaffald',
  robots: { index: false },
})

export default function SitemapRoute() {
  return __DEV__ ? <Sitemap /> : <NotFoundScreen />
}
