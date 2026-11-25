import * as Clipboard from 'expo-clipboard'
import { Pressable } from 'react-native'
import { Copy } from 'lucide-react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Checkbox,
  ErrorState,
  Input,
  Row,
  ScreenHeader,
  Stack,
  Text,
  useToast,
} from '@scaffald/ui'
import { LoadFailure } from '@scf/core/components/ui'
import { RouteBuilder } from '@scf/core/constants/routes'
import { useCreateWebhookMutation, useWebhookEventTypes } from '@scf/core/utils/webhooks-sdk-hooks'

/**
 * Create a webhook for one organization (#1440). The organization comes from
 * the URL and is sent with the request, so a member of several never hits the
 * api's "pass organization_id" refusal. Moved from /office/webhooks/create.
 */
export function WebhookCreateScreen({
  organizationId,
  slug,
  canManage,
}: {
  organizationId: string
  slug: string
  canManage: boolean
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
  const [secret, setSecret] = useState('')

  const {
    data: eventTypesData,
    isLoading: eventTypesLoading,
    isError: eventTypesFailed,
    error: eventTypesError,
    refetch: refetchEventTypes,
  } = useWebhookEventTypes({ enabled: canManage })
  const eventTypes = eventTypesData?.data ?? []

  const createWebhook = useCreateWebhookMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', 'list'] })
      // Show the secret once, on this page. Alert.alert is a no-op on web,
      // and on native it navigated away before the secret could be read.
      setSecret(data.data.secret)
    },
    onError: (error) => {
      // A toast, not Alert.alert: on web an Alert is silently dropped.
      toast.show({ message: error.message, variant: 'error' })
    },
  })

  const backToList = () => router.push(RouteBuilder.orgWebhooks(slug))

  if (!canManage) {
    // The api refuses anyone but an admin; say so rather than draw a form
    // whose submit can only fail.
    return (
      <LoadFailure
        error={{ statusCode: 403 }}
        noun="webhook"
        back={{ label: 'Webhooks', href: RouteBuilder.orgWebhooks(slug) }}
      />
    )
  }

  const toggle = (eventType: string) => {
    const next = new Set(selectedEvents)
    if (next.has(eventType)) next.delete(eventType)
    else next.add(eventType)
    setSelectedEvents(next)
  }

  const handleSubmit = () => {
    if (!url?.startsWith('https://')) {
      toast.show({ message: 'Webhook URL must start with https://', variant: 'error' })
      return
    }
    if (selectedEvents.size === 0) {
      toast.show({ message: 'Select at least one event type', variant: 'error' })
      return
    }
    createWebhook.mutate({
      organization_id: organizationId,
      url,
      description,
      events: Array.from(selectedEvents),
    })
  }

  const eventsByCategory = eventTypes.reduce(
    (acc, event) => {
      if (!acc[event.category]) acc[event.category] = []
      acc[event.category].push(event)
      return acc
    },
    {} as Record<string, typeof eventTypes>
  )

  if (secret) {
    return (
      <Stack gap={16}>
        <ScreenHeader
          kicker="Developers"
          title="Save your webhook secret"
          tip="This is the only time the secret is shown. Store it somewhere safe; it signs every delivery (HMAC-SHA256)."
        />
        <Card padding="lg">
          <Stack gap={16}>
            <Text style={{ fontFamily: 'monospace' }} selectable>
              {secret}
            </Text>
            <Row gap={8} wrap>
              <Button
                variant="outline"
                iconStart={Copy}
                onPress={async () => {
                  await Clipboard.setStringAsync(secret)
                  toast.show({ message: 'Secret copied', variant: 'success' })
                }}
              >
                Copy secret
              </Button>
              <Button variant="filled" color="primary" onPress={backToList}>
                I've saved my secret
              </Button>
            </Row>
          </Stack>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack gap={16}>
      <ScreenHeader
        kicker="Developers"
        title="Create webhook"
        back={{ label: 'Webhooks', onPress: backToList }}
        actions={
          <Row gap={8}>
            <Button variant="outline" onPress={backToList} disabled={createWebhook.isPending}>
              Cancel
            </Button>
            <Button
              variant="filled"
              color="primary"
              onPress={handleSubmit}
              disabled={createWebhook.isPending}
            >
              {createWebhook.isPending ? 'Creating…' : 'Create Webhook'}
            </Button>
          </Row>
        }
      />

      <Card padding="lg">
        <Stack gap={20}>
          <Text>Endpoint Configuration</Text>

          <Stack gap={8}>
            <Text>Endpoint URL *</Text>
            <Input
              value={url}
              onChangeText={setUrl}
              placeholder="https://api.example.com/webhooks"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text color="tertiary">
              Must be a valid HTTPS URL. Your endpoint will receive POST requests.
            </Text>
          </Stack>

          <Stack gap={8}>
            <Text>Description (Optional)</Text>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Production webhook for order notifications"
              multiline
              numberOfLines={3}
            />
          </Stack>
        </Stack>
      </Card>

      <Card padding="lg">
        <Stack gap={20}>
          <Text>Event Subscriptions *</Text>
          <Text color="secondary">Select the events you want to receive notifications for</Text>

          {eventTypesLoading ? (
            <Text color="secondary">Loading events...</Text>
          ) : eventTypesFailed || eventTypes.length === 0 ? (
            // A failed catalog is not "nothing to subscribe to" (#1085).
            <ErrorState
              title="Couldn’t load events"
              description="The list of subscribable events did not load, so there is nothing to pick yet."
              error={eventTypesError as Error}
              retry={() => refetchEventTypes()}
            />
          ) : (
            <Stack gap={24}>
              {Object.entries(eventsByCategory).map(([category, events]) => (
                <Stack key={category} gap={12}>
                  <Text color="secondary" style={{ letterSpacing: 0.5 }}>
                    {category}
                  </Text>
                  <Stack gap={8}>
                    {events.map((event) => (
                      <Pressable key={event.value} onPress={() => toggle(event.value)}>
                        <Row gap={12} align="center" padding="sm">
                          <Checkbox
                            checked={selectedEvents.has(event.value)}
                            onChange={() => toggle(event.value)}
                          />
                          <Stack gap={4}>
                            <Text style={{ fontFamily: 'monospace' }}>{event.value}</Text>
                            <Text color="secondary">{event.label}</Text>
                          </Stack>
                        </Row>
                      </Pressable>
                    ))}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}

          <Text color="tertiary">
            {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
          </Text>
        </Stack>
      </Card>

      <Card padding="lg">
        <Stack gap={8}>
          <Text>Configuration Details</Text>
          <Row justify="space-between">
            <Text color="secondary">Max Retries:</Text>
            <Text>3 attempts</Text>
          </Row>
          <Row justify="space-between">
            <Text color="secondary">Retry Backoff:</Text>
            <Text>1min, 5min, 15min</Text>
          </Row>
          <Row justify="space-between">
            <Text color="secondary">Timeout:</Text>
            <Text>10 seconds</Text>
          </Row>
          <Row justify="space-between">
            <Text color="secondary">Signature:</Text>
            <Text>HMAC-SHA256</Text>
          </Row>
        </Stack>
      </Card>
    </Stack>
  )
}
