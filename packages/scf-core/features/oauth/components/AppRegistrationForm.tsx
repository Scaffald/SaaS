/**
 * OAuth App Registration Form
 * REQ-10 Task 10: Self-service app registration form
 */

import { Button, Card, Input, Paragraph, SizableText, XStack, YStack } from '@unicornlove/ui'
import { useState } from 'react'
import { api } from '@scf/core/utils/api'

export function AppRegistrationForm() {
  const [appName, setAppName] = useState('')
  const [description, setDescription] = useState('')
  const [homepageUrl, setHomepageUrl] = useState('')
  const [redirectUris, setRedirectUris] = useState<string[]>([''])
  const [logoUrl, setLogoUrl] = useState('')
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('')
  const [termsUrl, setTermsUrl] = useState('')
  const [developerEmail, setDeveloperEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [credentials, setCredentials] = useState<{ client_id: string; client_secret: string } | null>(null)

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
      <YStack flex={1} padding="$4" maxWidth={800} alignSelf="center" gap="$4">
        <Card padding="$4" gap="$4">
          <YStack gap="$3">
            <SizableText size="$6" fontWeight="600">
              App Registration Successful!
            </SizableText>
            <Paragraph size="$3">
              Save your client credentials now. You won't be able to see the client_secret again.
            </Paragraph>

            <YStack gap="$2" padding="$4" backgroundColor="$blue2" borderRadius="$2">
              <YStack gap="$1">
                <SizableText size="$2" fontWeight="600">
                  Client ID
                </SizableText>
                <SizableText size="$3" fontFamily="$mono">
                  {credentials.client_id}
                </SizableText>
              </YStack>
              <YStack gap="$1">
                <SizableText size="$2" fontWeight="600">
                  Client Secret
                </SizableText>
                <SizableText size="$3" fontFamily="$mono" color="$red10">
                  {credentials.client_secret}
                </SizableText>
              </YStack>
            </YStack>

            <Paragraph size="$2" color="$yellow10">
              ⚠️ Important: Copy your client_secret now. It will not be shown again.
            </Paragraph>

            <YStack gap="$2">
              <SizableText size="$4" fontWeight="600">
                Next Steps
              </SizableText>
              <Paragraph size="$2">
                1. Test your app with the limited scopes (openid, profile, email)
              </Paragraph>
              <Paragraph size="$2">
                2. Request additional scopes via the developer dashboard
              </Paragraph>
              <Paragraph size="$2">
                3. Wait for admin approval for elevated permissions
              </Paragraph>
            </YStack>
          </YStack>
        </Card>
      </YStack>
    )
  }

  return (
    <YStack flex={1} padding="$4" maxWidth={800} alignSelf="center" gap="$4">
      <Card padding="$4" gap="$4">
        <YStack gap="$4">
          <YStack gap="$2">
            <SizableText size="$6" fontWeight="600">
              Register OAuth Application
            </SizableText>
            <Paragraph size="$2" color="$color11">
              Register your application to use Scaffald OAuth 2.0 for Single Sign-On
            </Paragraph>
          </YStack>

          <YStack gap="$3">
            <YStack gap="$1">
              <SizableText size="$3">App Name *</SizableText>
              <Input
                value={appName}
                onChangeText={setAppName}
                placeholder="My Awesome App"
                maxLength={100}
              />
            </YStack>

            <YStack gap="$1">
              <SizableText size="$3">Description *</SizableText>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description of your application"
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </YStack>

            <YStack gap="$1">
              <SizableText size="$3">Homepage URL *</SizableText>
              <Input
                value={homepageUrl}
                onChangeText={setHomepageUrl}
                placeholder="https://example.com"
                keyboardType="url"
              />
            </YStack>

            <YStack gap="$2">
              <SizableText size="$3">Redirect URIs *</SizableText>
              {redirectUris.map((uri, index) => (
                <XStack key={index} gap="$2">
                  <Input
                    flex={1}
                    value={uri}
                    onChangeText={(value) => updateRedirectUri(index, value)}
                    placeholder="https://example.com/auth/callback"
                    keyboardType="url"
                  />
                  {redirectUris.length > 1 && (
                    <Button onPress={() => removeRedirectUri(index)} variant="outlined">
                      Remove
                    </Button>
                  )}
                </XStack>
              ))}
              {redirectUris.length < 10 && (
                <Button onPress={addRedirectUri} variant="outlined" size="$2">
                  Add Redirect URI
                </Button>
              )}
            </YStack>

            <YStack gap="$1">
              <SizableText size="$3">Logo URL (optional)</SizableText>
              <Input
                value={logoUrl}
                onChangeText={setLogoUrl}
                placeholder="https://example.com/logo.png"
                keyboardType="url"
              />
            </YStack>

            <YStack gap="$1">
              <SizableText size="$3">Privacy Policy URL (optional)</SizableText>
              <Input
                value={privacyPolicyUrl}
                onChangeText={setPrivacyPolicyUrl}
                placeholder="https://example.com/privacy"
                keyboardType="url"
              />
            </YStack>

            <YStack gap="$1">
              <SizableText size="$3">Terms of Service URL (optional)</SizableText>
              <Input
                value={termsUrl}
                onChangeText={setTermsUrl}
                placeholder="https://example.com/terms"
                keyboardType="url"
              />
            </YStack>

            <YStack gap="$1">
              <SizableText size="$3">Developer Email *</SizableText>
              <Input
                value={developerEmail}
                onChangeText={setDeveloperEmail}
                placeholder="developer@example.com"
                keyboardType="email"
              />
            </YStack>
          </YStack>

          <XStack gap="$3" justifyContent="flex-end">
            <Button
              onPress={handleSubmit}
              disabled={isSubmitting || !appName || !description || !homepageUrl || !developerEmail}
              loading={isSubmitting}
            >
              Register Application
            </Button>
          </XStack>
        </YStack>
      </Card>
    </YStack>
  )
}

