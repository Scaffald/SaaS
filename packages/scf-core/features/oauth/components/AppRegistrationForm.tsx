/**
 * OAuth App Registration Form
 * Self-service app registration form
 */

import { Button, Card, Input, Paragraph, SizableText, Row, Stack, useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import { useState } from 'react'
import { api } from '@scf/core/utils/api'

export function AppRegistrationForm() {
  const { theme } = useThemeContext()
  const [appName, setAppName] = useState('')
  const [description, setDescription] = useState('')
  const [homepageUrl, setHomepageUrl] = useState('')
  const [redirectUris, setRedirectUris] = useState<string[]>([''])
  const [logoUrl, setLogoUrl] = useState('')
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('')
  const [termsUrl, setTermsUrl] = useState('')
  const [developerEmail, setDeveloperEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [credentials, setCredentials] = useState<{
    client_id: string
    client_secret: string
  } | null>(null)

  const registerApp = api.oauth.registerApp.useMutation()

  function addRedirectUri() {
    setRedirectUris([...redirectUris, ''])
  }

  function removeRedirectUri(index: number) {
    setRedirectUris(redirectUris.filter((_, i) => i !== index))
  }

  function updateRedirectUri(index: number, value: string) {
    const updated = [...redirectUris]
    updated[index] = value
    setRedirectUris(updated)
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const result = await registerApp.mutateAsync({
        name: appName,
        description,
        homepage_url: homepageUrl,
        redirect_uris: redirectUris.filter((uri) => uri.length > 0),
        logo_url: logoUrl || undefined,
        privacy_policy_url: privacyPolicyUrl || undefined,
        terms_of_service_url: termsUrl || undefined,
        developer_email: developerEmail,
      })

      setCredentials({
        client_id: result.client_id,
        client_secret: result.client_secret,
      })
    } catch (error) {
      console.error('[oauth] App registration failed', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (credentials) {
    return (
      <Stack flex={1} padding="md" maxWidth={800} alignSelf="center" gap={16}>
        <Card padding="md" gap={16}>
          <Stack gap={12}>
            <SizableText size={24}>App Registration Successful!</SizableText>
            <Paragraph size="sm">
              Save your client credentials now. You won't be able to see the client_secret again.
            </Paragraph>

            <Stack gap={8} padding="md" style={{ backgroundColor: colors.bg[theme].info }} borderRadius={8}>
              <Stack gap={4}>
                <SizableText size="xs">Client ID</SizableText>
                <SizableText size="sm" style={{ fontFamily: 'monospace' }}>
                  {credentials.client_id}
                </SizableText>
              </Stack>
              <Stack gap={4}>
                <SizableText size="xs">Client Secret</SizableText>
                <SizableText size="sm" style={{ fontFamily: 'monospace', color: colors.text[theme].error }}>
                  {credentials.client_secret}
                </SizableText>
              </Stack>
            </Stack>

            <Paragraph size="xs" style={{ color: colors.text[theme].warning }}>
              ⚠️ Important: Copy your client_secret now. It will not be shown again.
            </Paragraph>

            <Stack gap={8}>
              <SizableText size="md">Next Steps</SizableText>
              <Paragraph size="xs">
                1. Test your app with the limited scopes (openid, profile, email)
              </Paragraph>
              <Paragraph size="xs">
                2. Request additional scopes via the developer dashboard
              </Paragraph>
              <Paragraph size="xs">3. Wait for admin approval for elevated permissions</Paragraph>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack flex={1} padding="md" maxWidth={800} alignSelf="center" gap={16}>
      <Card padding="md" gap={16}>
        <Stack gap={16}>
          <Stack gap={8}>
            <SizableText size={24}>Register OAuth Application</SizableText>
            <Paragraph size="xs" style={{ color: colors.text[theme].secondary }}>
              Register your application to use Scaffald OAuth 2.0 for Single Sign-On
            </Paragraph>
          </Stack>

          <Stack gap={12}>
            <Stack gap={4}>
              <SizableText size="sm">App Name *</SizableText>
              <Input
                value={appName}
                onChangeText={setAppName}
                placeholder="My Awesome App"
                maxLength={100}
              />
            </Stack>

            <Stack gap={4}>
              <SizableText size="sm">Description *</SizableText>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description of your application"
                multiline
                
                maxLength={500}
              />
            </Stack>

            <Stack gap={4}>
              <SizableText size="sm">Homepage URL *</SizableText>
              <Input
                value={homepageUrl}
                onChangeText={setHomepageUrl}
                placeholder="https://example.com"
                keyboardType="url"
              />
            </Stack>

            <Stack gap={8}>
              <SizableText size="sm">Redirect URIs *</SizableText>
              {redirectUris.map((uri, index) => (
                <Row key={index} gap={8}>
                  <Input
                    flex={1}
                    value={uri}
                    onChangeText={(value) => updateRedirectUri(index, value)}
                    placeholder="https://example.com/auth/callback"
                    keyboardType="url"
                  />
                  {redirectUris.length > 1 && (
                    <Button onPress={() => removeRedirectUri(index)} variant="outline">
                      Remove
                    </Button>
                  )}
                </Row>
              ))}
              {redirectUris.length < 10 && (
                <Button onPress={addRedirectUri} variant="outline" size="xs">
                  Add Redirect URI
                </Button>
              )}
            </Stack>

            <Stack gap={4}>
              <SizableText size="sm">Logo URL (optional)</SizableText>
              <Input
                value={logoUrl}
                onChangeText={setLogoUrl}
                placeholder="https://example.com/logo.png"
                keyboardType="url"
              />
            </Stack>

            <Stack gap={4}>
              <SizableText size="sm">Privacy Policy URL (optional)</SizableText>
              <Input
                value={privacyPolicyUrl}
                onChangeText={setPrivacyPolicyUrl}
                placeholder="https://example.com/privacy"
                keyboardType="url"
              />
            </Stack>

            <Stack gap={4}>
              <SizableText size="sm">Terms of Service URL (optional)</SizableText>
              <Input
                value={termsUrl}
                onChangeText={setTermsUrl}
                placeholder="https://example.com/terms"
                keyboardType="url"
              />
            </Stack>

            <Stack gap={4}>
              <SizableText size="sm">Developer Email *</SizableText>
              <Input
                value={developerEmail}
                onChangeText={setDeveloperEmail}
                placeholder="developer@example.com"
                keyboardType="email"
              />
            </Stack>
          </Stack>

          <Row gap={12} justify="flex-end">
            <Button
              onPress={handleSubmit}
              disabled={isSubmitting || !appName || !description || !homepageUrl || !developerEmail}
              loading={isSubmitting}
            >
              Register Application
            </Button>
          </Row>
        </Stack>
      </Card>
    </Stack>
  )
}
