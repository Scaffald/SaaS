import { api } from '@scf/core/utils/api'
import { useQueryClient } from '@tanstack/react-query'
import { useToast, useThemeContext } from '@scaffald/ui'
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
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
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
    <Stack flex={1} padding="md" gap={16}>
      <Stack gap={8}>
        <Text>Stripe Payments</Text>
        <Paragraph size="md" style={{ color: colors.text[theme].secondary }}>
          Manage API keys, webhook secrets, and connection diagnostics for the Stripe integration.
        </Paragraph>
      </Stack>

      <Stack gap={16} style={{ maxWidth: 720, width: '100%' }}>
        <Card padding="md" gap={16}>
          <Stack gap={8}>
            <Text>Publishable Key</Text>
            <Paragraph size="sm" style={{ color: colors.text[theme].secondary }}>
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
                style={{
                  backgroundColor: colors.bg[theme].primary,
                  color: colors.text[theme].secondary,
                }}
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

        <Card padding="md" gap={16}>
          <Stack gap={8}>
            <Text>Secret Keys</Text>
            <Paragraph size="sm" style={{ color: colors.text[theme].secondary }}>
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
                  style={{
                    backgroundColor: colors.bg[theme].success,
                    color: colors.text[theme].secondary,
                  }}
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
                <Text style={{ color: colors.text[theme].success }}>✓ Secret stored in Vault</Text>
              ) : (
                <Text style={{ color: colors.text[theme].error }}>API secret not configured</Text>
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
                  style={{
                    backgroundColor: colors.bg[theme].success,
                    color: colors.text[theme].secondary,
                  }}
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
                <Text style={{ color: colors.text[theme].success }}>✓ Webhook secret stored</Text>
              ) : (
                <Text style={{ color: colors.text[theme].error }}>
                  Webhook secret not configured
                </Text>
              )}
            </Stack>
          </Stack>
        </Card>

        <Card padding="md" gap={16}>
          <Stack gap={8}>
            <Text>Webhook Endpoint</Text>
            <Paragraph size="sm" style={{ color: colors.text[theme].secondary }}>
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

        <Card padding="md" gap={16}>
          <Stack gap={8}>
            <Text>Test Mode</Text>
            <Paragraph size="sm" style={{ color: colors.text[theme].secondary }}>
              Toggle between live and test credentials without redeploying the backend.
            </Paragraph>
          </Stack>
          <Row gap={12} align="center">
            <Switch
              id="stripe-test-mode"
              checked={data?.testMode ?? true}
              disabled={updateTestMode.isPending}
              onChange={(checked) =>
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

        <Card padding="md" gap={16}>
          <Stack gap={8}>
            <Text>Connection Diagnostics</Text>
            <Paragraph size="sm" style={{ color: colors.text[theme].secondary }}>
              Validates the current secret by calling Stripe. Fails if the API key lacks required
              permissions.
            </Paragraph>
          </Stack>

          <Stack gap={8}>
            <Text style={{ color: colors.text[theme].secondary }}>
              Last test: {formatDate(data?.lastTestedAt) ?? 'Never'}
            </Text>
            {data?.lastTestedStatus === 'failed' && data?.lastTestedError ? (
              <Paragraph size="sm" style={{ color: colors.text[theme].error }}>
                {data.lastTestedError}
              </Paragraph>
            ) : null}
          </Stack>

          <Row gap={8} justify="flex-end">
            <Button
              style={{
                backgroundColor: colors.bg[theme].primary,
                color: colors.text[theme].secondary,
              }}
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
