/**
 * /i/[code] — a worker's invite link (#1395, epic #1399).
 *
 * The code is either the inviter's personal code (core.users.referral_code)
 * or a per-invite code from POST /v1/invites. The loader fetches the public
 * preview (inviter first name and avatar only) so the first paint already
 * says who invited you; native, which has no loader, fetches on mount.
 *
 * Invite pages are personal: never indexed, never in a sitemap.
 */
import { InviteLandingScreen } from '@scf/core/features/invites/InviteLandingScreen'
import { useLocalSearchParams } from 'expo-router'
import type { GenerateMetadataFunction, LoaderFunction } from 'expo-server'
import { fetchInvitePreview, type PublicInvitePreview } from '../../../utils/public-content-loader'
import { useRouteLoaderData } from '../../../utils/use-route-loader-data'
import { type ViewportLoaderData, viewportFromRequest } from '../../../utils/server-viewport'

type InviteLoaderData = { preview: PublicInvitePreview | null } & ViewportLoaderData

export const loader: LoaderFunction<InviteLoaderData> = async (request, params) => {
  const preview = await fetchInvitePreview(params.code)
  return { preview, ...viewportFromRequest(request) }
}

export const generateMetadata: GenerateMetadataFunction = async (_request, params) => {
  const preview = await fetchInvitePreview(params.code)
  const title = preview
    ? `${preview.inviter.firstName} invited you to Scaffald`
    : "You're invited to Scaffald"
  const description =
    'Scaffald is where construction workers find their next job and get hired on their skills.'
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      siteName: 'Scaffald',
      type: 'website',
      ...(preview?.inviter.avatarUrl ? { images: preview.inviter.avatarUrl } : {}),
    },
    twitter: { card: 'summary', title, description },
  }
}

export default function InvitePage() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const loaderData = useRouteLoaderData<InviteLoaderData>()
  // undefined (not null) when the loader had nothing, so the screen fetches
  // for itself instead of declaring a working link expired.
  const initialPreview = loaderData?.preview ?? undefined
  return (
    <InviteLandingScreen
      code={typeof code === 'string' ? code : ''}
      initialPreview={initialPreview}
    />
  )
}
