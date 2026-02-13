import { api } from '@scf/core/utils/api'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@unicornlove/beyond-ui'
import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Input,
  Paragraph,
  Spinner,
  Switch,
  Text,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'

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
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = api.stripeSettings.getSettings.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  const updatePublishableKey = api.stripeSettings.updatePublishableKey.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [['stripeSettings', 'getSettings']] })
      toast.show({
          title: 'Success',
          message: 'Publishable key updated',
          variant: 'success',
        })
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'Failed to update publishable key'
      toast.show({
          title: 'Error',
          variant: 'error',
        })
    },
  })

  const updateApiKey = api.stripeSettings.updateApiKey.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [['stripeSettings', 'getSettings']] })
      toast.show({
          title: 'Success',
          message: 'Secret key stored securely',
          variant: 'success',
        })
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'Failed to store API secret'
      toast.show({
          title: 'Error',
          variant: 'error',
        })
    },
  })

  const updateWebhookSecret = api.stripeSettings.updateWebhookSecret.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [['stripeSettings', 'getSettings']] })
      toast.show({
          title: 'Success',
          message: 'Webhook secret stored securely',
          variant: 'success',
        })
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'Failed to store webhook secret'
      toast.show({
          title: 'Error',
          variant: 'error',
        })
    },
  })

  const updateTestMode = api.stripeSettings.updateTestMode.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [['stripeSettings', 'getSettings']] })
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'Failed to update mode'
      toast.show({
          title: 'Error',
          variant: 'error',
        })
    },
  })

  const testConnection = api.stripeSettings.testConnection.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [['stripeSettings', 'getSettings']] })
      toast.show({
          title: 'Success',
          message: 'Stripe connection verified',
          variant: 'success',
        })
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'Stripe connection test failed'
      toast.show({
          title: 'Error',
          variant: 'error',
        })
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
      toast.show({
          title: 'Error',
          message: 'Clipboard access is not available on this device.',
          variant: 'error',
        })
      return
    }

    try {
      await navigator.clipboard.writeText(webhookUrl)
      toast.show({
          title: 'Copied',
          message: 'Webhook endpoint copied to clipboard',
        })
    } catch {
      toast.show({
          title: 'Error',
          message: 'Unable to copy to clipboard',
          variant: 'error',
        })
    }
  }

  if (isLoading) {
    return (
      <Stack flex={1} align="center" justify="center" gap={12}>
        <Spinner size="lg" />
        <Text>Loading Stripe settings…</Text>
      </Stack>
    )
  }

  return (
    <Stack flex={1} padding={16} gap={16}>
      <Stack gap={8}>
        <Text>
          Stripe Payments
        </Text>
        <Paragraph size={16} color="gray">
          Manage API keys, webhook secrets, and connection diagnostics for the Stripe integration.
        </Paragraph>
      </Stack>

      <Stack gap={16} style={{ maxWidth: 720, width: '100%' }}>
        <Card padding={16} gap={16}>
          <Stack gap={8}>
            <Text>
              Publishable Key
            </Text>
            <Paragraph size={12} color="gray">
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
            <Row gap={8} justify="flex-end">
              <Button
                backgroundColor="$blue9"
                color="gray"
                disabled={updatePublishableKey.isPending || publishableKey.length < 16}
                onPress={() =>
                  updatePublishableKey.mutate({
                    publishableKey,
                  })
                }
              >
                {updatePublishableKey.isPending ? <Spinner /> : 'Save Publishable Key'}
              </Button>
            </Row>
          </Stack>
        </Card>

        <Card padding={16} gap={16}>
          <Stack gap={8}>
            <Text>
              Secret Keys
            </Text>
            <Paragraph size={12} color="gray">
              Secrets are encrypted with Supabase Vault. They are never returned by the API after
              storage.
            </Paragraph>
          </Stack>

          <Stack gap={12}>
            <Stack gap={8}>
              <Text>Stripe API Secret</Text>
              <Input
                value={apiSecret}
                onChangeText={setApiSecret}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                placeholder="sk_live_..."
              />
              <Row gap={8} justify="flex-end">
                <Button
                  backgroundColor="$green9"
                  color="gray"
                  disabled={updateApiKey.isPending || apiSecret.length < 20}
                  onPress={() => {
                    updateApiKey.mutate({ secret: apiSecret })
                    setApiSecret('')
                  }}
                >
                  {updateApiKey.isPending ? <Spinner /> : 'Store API Secret'}
                </Button>
              </Row>
              {data?.hasApiKey ? (
                <Text color="$green10">
                  ✓ Secret stored in Vault
                </Text>
              ) : (
                <Text color="$red10">
                  API secret not configured
                </Text>
              )}
            </Stack>

            <Stack gap={8}>
              <Text>Webhook Signing Secret</Text>
              <Input
                value={webhookSecret}
                onChangeText={setWebhookSecret}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                placeholder="whsec_..."
              />
              <Row gap={8} justify="flex-end">
                <Button
                  backgroundColor="$green9"
                  color="gray"
                  disabled={updateWebhookSecret.isPending || webhookSecret.length < 10}
                  onPress={() => {
                    updateWebhookSecret.mutate({ secret: webhookSecret })
                    setWebhookSecret('')
                  }}
                >
                  {updateWebhookSecret.isPending ? <Spinner /> : 'Store Webhook Secret'}
                </Button>
              </Row>
              {data?.hasWebhookSecret ? (
                <Text color="$green10">
                  ✓ Webhook secret stored
                </Text>
              ) : (
                <Text color="$red10">
                  Webhook secret not configured
                </Text>
              )}
            </Stack>
          </Stack>
        </Card>

        <Card padding={16} gap={16}>
          <Stack gap={8}>
            <Text>
              Webhook Endpoint
            </Text>
            <Paragraph size={12} color="gray">
              Configure this URL inside the Stripe Dashboard and supply the signing secret above.
            </Paragraph>
            <Input value={webhookUrl} editable={false} />
            <Row gap={8}>
              <Button variant="outline" flex={1} onPress={handleCopyWebhook}>
                Copy Endpoint
              </Button>
            </Row>
          </Stack>
        </Card>

        <Card padding={16} gap={16}>
          <Stack gap={8}>
            <Text>
              Test Mode
            </Text>
            <Paragraph size={12} color="gray">
              Toggle between live and test credentials without redeploying the backend.
            </Paragraph>
          </Stack>
          <Row gap={12} align="center">
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
          </Row>
        </Card>

        <Card padding={16} gap={16}>
          <Stack gap={8}>
            <Text>
              Connection Diagnostics
            </Text>
            <Paragraph size={12} color="gray">
              Validates the current secret by calling Stripe. Fails if the API key lacks required
              permissions.
            </Paragraph>
          </Stack>

          <Stack gap={8}>
            <Text color="gray">
              Last test: {formatDate(data?.lastTestedAt) ?? 'Never'}
            </Text>
            {data?.lastTestedStatus === 'failed' && data?.lastTestedError ? (
              <Paragraph size={12} color="$red10">
                {data.lastTestedError}
              </Paragraph>
            ) : null}
          </Stack>

          <Row gap={8} justify="flex-end">
            <Button
              backgroundColor="$blue9"
              color="gray"
              disabled={testConnection.isPending || !data?.hasApiKey}
              onPress={() => testConnection.mutate()}
            >
              {testConnection.isPending ? <Spinner /> : 'Run Connection Test'}
            </Button>
          </Row>
        </Card>
      </Stack>
    </Stack>
  )
}

export default StripeSettingsPage
