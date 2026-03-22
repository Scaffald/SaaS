/**
 * OAuth Consent Page
 * OAuth consent screen page
 */

import { ConsentScreen } from '@scf/core/features/oauth/components/ConsentScreen'
import { useOAuthAppDetails } from '@scf/core/utils/oauth-sdk-hooks'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'

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
  const params = useLocalSearchParams<{
    client_id: string
    redirect_uri: string
    state: string
    scope: string
    code_challenge?: string
    code_challenge_method?: string
  }>()
  const [appDetails, setAppDetails] = useState<AppDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clientId = params.client_id
  const redirectUri = params.redirect_uri
  const state = params.state
  const scope = params.scope
  const codeChallenge = params.code_challenge as string
  const codeChallengeMethod = (params.code_challenge_method as string) || 'S256'

  const getAppDetails = useOAuthAppDetails(clientId || undefined, { enabled: !!clientId })

  useEffect(() => {
    if (getAppDetails.data) {
      setAppDetails(getAppDetails.data)
      setIsLoading(false)
    }
  }, [getAppDetails.data])

  if (isLoading || !appDetails) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    )
  }

  if (!clientId || !redirectUri || !state) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Invalid OAuth authorization request</Text>
      </View>
    )
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
