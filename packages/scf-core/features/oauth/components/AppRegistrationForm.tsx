/**
 * OAuth App Registration Form
 * Self-service app registration form
 */

import {
  Button,
  Card,
  Input,
  Paragraph,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useState } from 'react'
import { useRegisterAppMutation } from '@scf/core/utils/oauth-sdk-hooks'

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

  const registerApp = useRegisterAppMutation()

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
        <Card padding="md">
          <Stack gap={12}>
            <Text size="2xl">App Registration Successful!</Text>
            <Paragraph size="sm">
              Save your client credentials now. You won't be able to see the client_secret again.
            </Paragraph>

            <Stack
              gap={8}
              padding="md"
              style={{ backgroundColor: theme === "light" ? colors.blue[50] : colors.blue[900] }}
              borderRadius={8}
            >
              <Stack gap={4}>
                <Text size="sm">Client ID</Text>
                <Text size="sm" style={{ fontFamily: 'monospace' }}>
                  {credentials.client_id}
                </Text>
              </Stack>
              <Stack gap={4}>
                <Text size="sm">Client Secret</Text>
                <Text
                  size="sm"
                  style={{ fontFamily: 'monospace', color: theme === "light" ? colors.error[700] : colors.error[300] }}
                >
                  {credentials.client_secret}
                </Text>
              </Stack>
            </Stack>

            <Paragraph size="sm" style={{ color: theme === "light" ? colors.yellow[700] : colors.yellow[300] }}>
              ⚠️ Important: Copy your client_secret now. It will not be shown again.
            </Paragraph>

            <Stack gap={8}>
              <Text size="md">Next Steps</Text>
              <Paragraph size="sm">
                1. Test your app with the limited scopes (openid, profile, email)
              </Paragraph>
              <Paragraph size="sm">
                2. Request additional scopes via the developer dashboard
              </Paragraph>
              <Paragraph size="sm">3. Wait for admin approval for elevated permissions</Paragraph>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack flex={1} padding="md" maxWidth={800} alignSelf="center" gap={16}>
      <Card padding="md">
        <Stack gap={16}>
          <Stack gap={8}>
            <Text size="2xl">Register OAuth Application</Text>
            <Paragraph size="sm" style={{ color: colors.text[theme].secondary }}>
              Register your application to use Scaffald OAuth 2.0 for Single Sign-On
            </Paragraph>
          </Stack>

          <Stack gap={12}>
            <Stack gap={4}>
              <Text size="sm">App Name *</Text>
              <Input
                value={appName}
                onChangeText={setAppName}
                placeholder="My Awesome App"
                maxLength={100}
              />
            </Stack>

            <Stack gap={4}>
              <Text size="sm">Description *</Text>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description of your application"
                multiline
                maxLength={500}
              />
            </Stack>

            <Stack gap={4}>
              <Text size="sm">Homepage URL *</Text>
              <Input
                value={homepageUrl}
                onChangeText={setHomepageUrl}
                placeholder="https://example.com"
                keyboardType="url"
              />
            </Stack>

            <Stack gap={8}>
              <Text size="sm">Redirect URIs *</Text>
              {redirectUris.map((uri, index) => (
                <Row key={index} gap={8}>
                  <Input
                    style={{ flex: 1 }}
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
                <Button onPress={addRedirectUri} variant="outline" size="sm">
                  Add Redirect URI
                </Button>
              )}
            </Stack>

            <Stack gap={4}>
              <Text size="sm">Logo URL (optional)</Text>
              <Input
                value={logoUrl}
                onChangeText={setLogoUrl}
                placeholder="https://example.com/logo.png"
                keyboardType="url"
              />
            </Stack>

            <Stack gap={4}>
              <Text size="sm">Privacy Policy URL (optional)</Text>
              <Input
                value={privacyPolicyUrl}
                onChangeText={setPrivacyPolicyUrl}
                placeholder="https://example.com/privacy"
                keyboardType="url"
              />
            </Stack>

            <Stack gap={4}>
              <Text size="sm">Terms of Service URL (optional)</Text>
              <Input
                value={termsUrl}
                onChangeText={setTermsUrl}
                placeholder="https://example.com/terms"
                keyboardType="url"
              />
            </Stack>

            <Stack gap={4}>
              <Text size="sm">Developer Email *</Text>
              <Input
                value={developerEmail}
                onChangeText={setDeveloperEmail}
                placeholder="developer@example.com"
                keyboardType="email-address"
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
