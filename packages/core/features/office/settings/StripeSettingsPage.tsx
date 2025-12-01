import { api } from '@app/core/utils/api'
import { useToastController } from '@tamagui/toast'
import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Input,
  Paragraph,
  Spinner,
  Switch,
  Text,
  XStack,
  YStack,
} from '@unicornlove/ui'

function formatDate(value?: string | null): string | null {
  if (!value) return null
  try {
    const date = new Date(value)
    return date.toLocaleString()
  } catch {
    return value
  }
}

export function StripeSettingsPage() {
  const toast = useToastController()
  const utils = api.useContext()

  const { data, isLoading } = api.stripeSettings.getSettings.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  const updatePublishableKey = api.stripeSettings.updatePublishableKey.useMutation({
    onSuccess: async () => {
      await utils.stripeSettings.getSettings.invalidate()
      toast.show('Success', { message: 'Publishable key updated' })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update publishable key'
      toast.show('Error', { message })
    },
  })

  const updateApiKey = api.stripeSettings.updateApiKey.useMutation({
    onSuccess: async () => {
      await utils.stripeSettings.getSettings.invalidate()
      toast.show('Success', { message: 'Secret key stored securely' })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to store API secret'
      toast.show('Error', { message })
    },
  })

  const updateWebhookSecret = api.stripeSettings.updateWebhookSecret.useMutation({
    onSuccess: async () => {
      await utils.stripeSettings.getSettings.invalidate()
      toast.show('Success', { message: 'Webhook secret stored securely' })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to store webhook secret'
      toast.show('Error', { message })
    },
  })

  const updateTestMode = api.stripeSettings.updateTestMode.useMutation({
    onSuccess: async () => {
      await utils.stripeSettings.getSettings.invalidate()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update mode'
      toast.show('Error', { message })
    },
  })

  const testConnection = api.stripeSettings.testConnection.useMutation({
    onSuccess: async () => {
      await utils.stripeSettings.getSettings.invalidate()
      toast.show('Success', { message: 'Stripe connection verified' })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Stripe connection test failed'
      toast.show('Error', { message })
    },
  })

  const [publishableKey, setPublishableKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')

  useEffect(() => {
    if (data?.publishableKey) {
      setPublishableKey(data.publishableKey)
    }
  }, [data?.publishableKey])

  const webhookUrl = useMemo(() => data?.webhookEndpointUrl ?? '', [data?.webhookEndpointUrl])

  const handleCopyWebhook = async () => {
    if (!webhookUrl) return
    const canCopy = typeof navigator !== 'undefined' && Boolean(navigator?.clipboard?.writeText)

    if (!canCopy) {
      toast.show('Error', {
        message: 'Clipboard access is not available on this device.',
      })
      return
    }

    try {
      await navigator.clipboard.writeText(webhookUrl)
      toast.show('Copied', { message: 'Webhook endpoint copied to clipboard' })
    } catch {
      toast.show('Error', { message: 'Unable to copy to clipboard' })
    }
  }

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <Spinner size="large" />
        <Text>Loading Stripe settings…</Text>
      </YStack>
    )
  }

  return (
    <YStack flex={1} padding="$4" gap="$4">
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="700">
          Stripe Payments
        </Text>
        <Paragraph size="$4" color="$color11">
          Manage API keys, webhook secrets, and connection diagnostics for the Stripe integration.
        </Paragraph>
      </YStack>

      <YStack gap="$4" style={{ maxWidth: 720, width: '100%' }}>
        <Card padding="$4" gap="$4">
          <YStack gap="$2">
            <Text fontSize="$6" fontWeight="600">
              Publishable Key
            </Text>
            <Paragraph size="$3" color="$color10">
              Used on the client to initialize Stripe.js. Updating this key does not affect existing
              payment intents.
            </Paragraph>
            <Input
              value={publishableKey}
              onChangeText={setPublishableKey}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="pk_live_..."
            />
            <XStack gap="$2" justifyContent="flex-end">
              <Button
                backgroundColor="$blue9"
                color="$color1"
                disabled={updatePublishableKey.isPending || publishableKey.length < 16}
                onPress={() =>
                  updatePublishableKey.mutate({
                    publishableKey,
                  })
                }
              >
                {updatePublishableKey.isPending ? <Spinner /> : 'Save Publishable Key'}
              </Button>
            </XStack>
          </YStack>
        </Card>

        <Card padding="$4" gap="$4">
          <YStack gap="$2">
            <Text fontSize="$6" fontWeight="600">
              Secret Keys
            </Text>
            <Paragraph size="$3" color="$color10">
              Secrets are encrypted with Supabase Vault. They are never returned by the API after
              storage.
            </Paragraph>
          </YStack>

          <YStack gap="$3">
            <YStack gap="$2">
              <Text fontWeight="600">Stripe API Secret</Text>
              <Input
                value={apiSecret}
                onChangeText={setApiSecret}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                placeholder="sk_live_..."
              />
              <XStack gap="$2" justifyContent="flex-end">
                <Button
                  backgroundColor="$green9"
                  color="$color1"
                  disabled={updateApiKey.isPending || apiSecret.length < 20}
                  onPress={() => {
                    updateApiKey.mutate({ secret: apiSecret })
                    setApiSecret('')
                  }}
                >
                  {updateApiKey.isPending ? <Spinner /> : 'Store API Secret'}
                </Button>
              </XStack>
              {data?.hasApiKey ? (
                <Text fontSize="$2" color="$green10">
                  ✓ Secret stored in Vault
                </Text>
              ) : (
                <Text fontSize="$2" color="$red10">
                  API secret not configured
                </Text>
              )}
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Webhook Signing Secret</Text>
              <Input
                value={webhookSecret}
                onChangeText={setWebhookSecret}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                placeholder="whsec_..."
              />
              <XStack gap="$2" justifyContent="flex-end">
                <Button
                  backgroundColor="$green9"
                  color="$color1"
                  disabled={updateWebhookSecret.isPending || webhookSecret.length < 10}
                  onPress={() => {
                    updateWebhookSecret.mutate({ secret: webhookSecret })
                    setWebhookSecret('')
                  }}
                >
                  {updateWebhookSecret.isPending ? <Spinner /> : 'Store Webhook Secret'}
                </Button>
              </XStack>
              {data?.hasWebhookSecret ? (
                <Text fontSize="$2" color="$green10">
                  ✓ Webhook secret stored
                </Text>
              ) : (
                <Text fontSize="$2" color="$red10">
                  Webhook secret not configured
                </Text>
              )}
            </YStack>
          </YStack>
        </Card>

        <Card padding="$4" gap="$4">
          <YStack gap="$2">
            <Text fontSize="$6" fontWeight="600">
              Webhook Endpoint
            </Text>
            <Paragraph size="$3" color="$color10">
              Configure this URL inside the Stripe Dashboard and supply the signing secret above.
            </Paragraph>
            <Input value={webhookUrl} editable={false} />
            <XStack gap="$2">
              <Button variant="outlined" flex={1} onPress={handleCopyWebhook}>
                Copy Endpoint
              </Button>
            </XStack>
          </YStack>
        </Card>

        <Card padding="$4" gap="$4">
          <YStack gap="$2">
            <Text fontSize="$6" fontWeight="600">
              Test Mode
            </Text>
            <Paragraph size="$3" color="$color10">
              Toggle between live and test credentials without redeploying the backend.
            </Paragraph>
          </YStack>
          <XStack gap="$3" alignItems="center">
            <Switch
              id="stripe-test-mode"
              checked={data?.testMode ?? true}
              disabled={updateTestMode.isPending}
              onCheckedChange={(checked) =>
                updateTestMode.mutate({
                  testMode: Boolean(checked),
                })
              }
            >
              <Switch.Thumb />
            </Switch>
            <Text>{(data?.testMode ?? true) ? 'Test mode' : 'Live mode'}</Text>
          </XStack>
        </Card>

        <Card padding="$4" gap="$4">
          <YStack gap="$2">
            <Text fontSize="$6" fontWeight="600">
              Connection Diagnostics
            </Text>
            <Paragraph size="$3" color="$color10">
              Validates the current secret by calling Stripe. Fails if the API key lacks required
              permissions.
            </Paragraph>
          </YStack>

          <YStack gap="$2">
            <Text fontSize="$3" color="$color11">
              Last test: {formatDate(data?.lastTestedAt) ?? 'Never'}
            </Text>
            {data?.lastTestedStatus === 'failed' && data?.lastTestedError ? (
              <Paragraph size="$3" color="$red10">
                {data.lastTestedError}
              </Paragraph>
            ) : null}
          </YStack>

          <XStack gap="$2" justifyContent="flex-end">
            <Button
              backgroundColor="$blue9"
              color="$color1"
              disabled={testConnection.isPending || !data?.hasApiKey}
              onPress={() => testConnection.mutate()}
            >
              {testConnection.isPending ? <Spinner /> : 'Run Connection Test'}
            </Button>
          </XStack>
        </Card>
      </YStack>
    </YStack>
  )
}

export default StripeSettingsPage
