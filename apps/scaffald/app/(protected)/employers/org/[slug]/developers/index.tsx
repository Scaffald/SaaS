import { RouteBuilder } from '@scf/core/constants/routes'
import { Redirect, useLocalSearchParams } from 'expo-router'

// The Developers tab opens on its first view, API keys (#1440).
export default function OrgDevelopersIndexPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  return <Redirect href={RouteBuilder.orgApiKeys(slug ?? '')} />
}
