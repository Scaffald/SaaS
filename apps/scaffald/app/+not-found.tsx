import { NotFoundScreen } from '@scf/core/components/NotFoundScreen'
import type { GenerateMetadataFunction } from 'expo-server'

/**
 * Any URL no route matches (#1082). On web the server answers these with a
 * 404 status; this only replaces expo-router's stock "Unmatched Route" page.
 */
export const generateMetadata: GenerateMetadataFunction = () => ({
  title: 'Page Not Found | Scaffald',
  robots: { index: false },
})

export default function NotFoundRoute() {
  return <NotFoundScreen />
}
