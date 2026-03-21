/**
 * OAuth Consent Screen Component
 * OAuth consent screen UI component
 */

import { useGrantConsentMutation } from '@scf/core/utils/oauth-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import {
  Button,
  Card,
  Checkbox,
  Paragraph,
  Separator,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Image } from 'react-native'
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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { user } = useUser()
  const [rememberConsent, setRememberConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const grantConsent = useGrantConsentMutation()

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
    <Stack flex={1} padding="md" maxWidth={600} alignSelf="center" gap={16}>
      <Card padding="md">
        <Stack gap={16}>
        <Stack gap={12}>
          <Row gap={12} align="center">
            {app.logo_url && (
              <Image
                source={{ uri: app.logo_url }}
                style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: colors.bg[t].subtle }}
              />
            )}
            <Stack flex={1} gap={4}>
              <Text size="2xl">{app.name} wants to access your Scaffald account</Text>
              {app.description && (
                <Paragraph size="sm" style={{ color: colors.text[t].secondary }}>
                  {app.description}
                </Paragraph>
              )}
            </Stack>
          </Row>

          {app.homepage_url && (
            <Paragraph size="sm">
              <a href={app.homepage_url} target="_blank" rel="noopener noreferrer">
                Visit {app.name}
              </a>
            </Paragraph>
          )}
        </Stack>
        <Separator />

        <Stack gap={8}>
          <Text size="md">Permissions Requested</Text>
          <Stack gap={8}>
            {requestedScopes.map((scope) => (
              <ScopePermissionItem key={scope} scope={scope} />
            ))}
          </Stack>
        </Stack>

        <Separator />

        <Stack gap={8}>
          <Text size="sm" style={{ color: colors.text[t].secondary }}>
            Authorizing as {user?.email}
          </Text>
          <Checkbox
            checked={rememberConsent}
            onChange={setRememberConsent}
            label="Remember this authorization (skip consent screen in the future)"
          />
        </Stack>

        <Separator />

        <Row gap={12} justify="flex-end">
          <Button variant="outline" onPress={handleDeny} disabled={isSubmitting}>
            Deny
          </Button>
          <Button onPress={handleAuthorize} disabled={isSubmitting} loading={isSubmitting}>
            Authorize
          </Button>
        </Row>

        {(app.privacy_policy_url || app.terms_of_service_url) && (
          <Stack gap={4}>
            <Text size="sm" style={{ color: colors.text[t].secondary, textAlign: 'center' }}>
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
            </Text>
          </Stack>
        )}
        </Stack>
      </Card>
    </Stack>
  )
}

function ScopePermissionItem({ scope }: { scope: string }) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
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
    <Row gap={8} align="flex-start">
      <Text size="sm">•</Text>
      <Stack flex={1}>
        <Text size="sm">{description}</Text>
        <Text size="sm" style={{ color: colors.text[t].secondary }}>
          {scope}
        </Text>
      </Stack>
    </Row>
  )
}
