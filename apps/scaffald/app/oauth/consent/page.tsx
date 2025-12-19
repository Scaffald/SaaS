/**
 * OAuth Consent Page
 * REQ-10 Task 9: Consent screen page
 */

import { ConsentScreen } from '@scf/core/features/oauth/components/ConsentScreen'
import { api } from '@scf/core/utils/api'
import { useSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'

interface AppDetails {
  id: string
  name: string
  logo_url: string | null
  homepage_url: string | null
  description: string | null
  privacy_policy_url: string | null
  terms_of_service_url: string | null
}

export default function OAuthConsentPage() {
  const params = useSearchParams()
  const [appDetails, setAppDetails] = useState<AppDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clientId = params.client_id as string
  const redirectUri = params.redirect_uri as string
  const state = params.state as string
  const scope = params.scope as string
  const codeChallenge = params.code_challenge as string
  const codeChallengeMethod = (params.code_challenge_method as string) || 'S256'

  const getAppDetails = api.oauth.getAppDetails.useQuery(
    { client_id: clientId },
    { enabled: !!clientId }
  )

  useEffect(() => {
    if (getAppDetails.data) {
      setAppDetails(getAppDetails.data)
      setIsLoading(false)
    }
  }, [getAppDetails.data])

  if (isLoading || !appDetails) {
    return <div>Loading...</div>
  }

  if (!clientId || !redirectUri || !state) {
    return <div>Invalid OAuth authorization request</div>
  }

  const requestedScopes = scope ? scope.split(' ').filter((s) => s.length > 0) : []

  return (
    <ConsentScreen
      app={{
        id: appDetails.id,
        name: appDetails.name,
        logo_url: appDetails.logo_url || undefined,
        homepage_url: appDetails.homepage_url || undefined,
        description: appDetails.description || undefined,
        privacy_policy_url: appDetails.privacy_policy_url || undefined,
        terms_of_service_url: appDetails.terms_of_service_url || undefined,
      }}
      requestedScopes={requestedScopes}
      state={state}
      redirectUri={redirectUri}
      codeChallenge={codeChallenge}
      codeChallengeMethod={codeChallengeMethod}
    />
  )
}

