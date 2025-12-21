/**
 * OAuth Consent Screen Component
 * REQ-10 Task 9: Build OAuth consent screen UI component
 */

import { api } from '@scf/core/utils/api'
import { useUser } from '@scf/core/utils/useUser'
import { Button, Card, Checkbox, Image, Paragraph, Separator, SizableText, XStack, YStack } from '@unicornlove/ui'
import { useState } from 'react'

interface ConsentScreenProps {
  app: {
    id: string
    name: string
    logo_url?: string
    homepage_url?: string
    description?: string
    privacy_policy_url?: string
    terms_of_service_url?: string
  }
  requestedScopes: string[]
  state: string
  redirectUri: string
  codeChallenge?: string
  codeChallengeMethod?: string
  onAuthorize?: () => void
  onDeny?: () => void
}

export function ConsentScreen({
  app,
  requestedScopes,
  state,
  redirectUri,
  codeChallenge,
  codeChallengeMethod = 'S256',
  onAuthorize,
  onDeny,
}: ConsentScreenProps) {
  const { user } = useUser()
  const [rememberConsent, setRememberConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const grantConsent = api.oauth.grantConsent.useMutation()

  async function handleAuthorize() {
    setIsSubmitting(true)
    try {
      if (!codeChallenge) {
        console.error('[oauth] Missing code_challenge for PKCE')
        return
      }

      // Store consent and complete authorization
      const result = await grantConsent.mutateAsync({
        oauth_app_id: app.id,
        scopes: requestedScopes,
        remember: rememberConsent,
        state,
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod,
      })

      // Redirect to client app
      if (result.redirect_url) {
        window.location.href = result.redirect_url
      }

      onAuthorize?.()
    } catch (error) {
      console.error('[oauth] Consent authorization failed', error)
      // Handle error
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDeny() {
    // Redirect to client with access_denied error
    const redirectUrl = new URL(redirectUri)
    redirectUrl.searchParams.set('error', 'access_denied')
    redirectUrl.searchParams.set('state', state)

    if (onDeny) {
      onDeny()
    } else {
      window.location.href = redirectUrl.toString()
    }
  }

  return (
    <YStack flex={1} padding="$4" maxWidth={600} alignSelf="center" gap="$4">
      <Card padding="$4" gap="$4">
        <YStack gap="$3">
          <XStack gap="$3" alignItems="center">
            {app.logo_url && (
              <Image
                source={{ uri: app.logo_url }}
                width={64}
                height={64}
                borderRadius="$2"
                backgroundColor="$color3"
              />
            )}
            <YStack flex={1} gap="$1">
              <SizableText size="$6" fontWeight="600">
                {app.name} wants to access your Scaffald account
              </SizableText>
              {app.description && (
                <Paragraph size="$2" color="$color11">
                  {app.description}
                </Paragraph>
              )}
            </YStack>
          </XStack>

          {app.homepage_url && (
            <Paragraph size="$2">
              <a href={app.homepage_url} target="_blank" rel="noopener noreferrer">
                Visit {app.name}
              </a>
            </Paragraph>
          )}
        </YStack>

        <Separator />

        <YStack gap="$2">
          <SizableText size="$4" fontWeight="600">
            Permissions Requested
          </SizableText>
          <YStack gap="$2">
            {requestedScopes.map((scope) => (
              <ScopePermissionItem key={scope} scope={scope} />
            ))}
          </YStack>
        </YStack>

        <Separator />

        <YStack gap="$2">
          <SizableText size="$3" color="$color11">
            Authorizing as {user?.email}
          </SizableText>
          <Checkbox
            checked={rememberConsent}
            onCheckedChange={setRememberConsent}
            label="Remember this authorization (skip consent screen in the future)"
          />
        </YStack>

        <Separator />

        <XStack gap="$3" justifyContent="flex-end">
          <Button variant="outlined" onPress={handleDeny} disabled={isSubmitting}>
            Deny
          </Button>
          <Button onPress={handleAuthorize} disabled={isSubmitting} loading={isSubmitting}>
            Authorize
          </Button>
        </XStack>

        {(app.privacy_policy_url || app.terms_of_service_url) && (
          <YStack gap="$1">
            <SizableText size="$1" color="$color11" textAlign="center">
              <a
                href={app.privacy_policy_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginRight: 8 }}
              >
                Privacy Policy
              </a>
              {app.terms_of_service_url && (
                <a href={app.terms_of_service_url} target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>
              )}
            </SizableText>
          </YStack>
        )}
      </Card>
    </YStack>
  )
}

function ScopePermissionItem({ scope }: { scope: string }) {
  // Map scope to human-readable description
  const scopeDescriptions: Record<string, string> = {
    openid: 'Verify your identity',
    profile: 'Read your basic profile information',
    email: 'Read your email address',
    'read:user': 'Read your full profile',
    'write:user': 'Update your profile',
    'read:organizations': 'Read organization information',
    'write:organizations': 'Manage organizations',
    'read:projects': 'Read project information',
    'write:projects': 'Manage projects',
    'read:jobs': 'Read job postings',
    'write:jobs': 'Manage job postings',
  }

  const description = scopeDescriptions[scope] || scope

  return (
    <XStack gap="$2" alignItems="flex-start">
      <SizableText size="$3">•</SizableText>
      <YStack flex={1}>
        <SizableText size="$3">{description}</SizableText>
        <SizableText size="$1" color="$color11">
          {scope}
        </SizableText>
      </YStack>
    </XStack>
  )
}

