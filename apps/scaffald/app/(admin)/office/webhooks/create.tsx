/**
 * Create Webhook Page
 * Form for creating a new webhook endpoint
 */

import * as Clipboard from 'expo-clipboard'
import { Pressable } from 'react-native'
import { Copy } from 'lucide-react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useWebhookEventTypes, useCreateWebhookMutation } from '@scf/core/utils/webhooks-sdk-hooks'
import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import {
  Button,
  Card,
  Checkbox,
  ErrorState,
  Row,
  Stack,
  Text,
  Input,
  ScreenHeader,
  useToast,
} from '@scaffald/ui'
import { ROUTES } from '@scf/core/constants/routes'
import type { WebhookEventType } from '@scf/schemas'

export default function CreateWebhookPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<Set<WebhookEventType>>(new Set())
  const [secret, setSecret] = useState('')

  // Fetch available event types
  const {
    data: eventTypesData,
    isLoading: eventTypesLoading,
    isError: eventTypesFailed,
    error: eventTypesError,
    refetch: refetchEventTypes,
  } = useWebhookEventTypes()
  const eventTypes = eventTypesData?.data ?? []

  // Create webhook mutation
  const createWebhook = useCreateWebhookMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', 'list'] })
      // Show the secret once, on the page below. This used Alert.alert,
      // which is a no-op on web, and on native it navigated away before the
      // secret screen could be read.
      setSecret(data.data.secret)
    },
    onError: (error) => {
      // A toast, not Alert.alert: on web an Alert is silently dropped, so a
      // failed create looked like a button that did nothing.
      toast.show({ message: error.message, variant: 'error' })
    },
  })

  const handleToggleEvent = (eventType: WebhookEventType) => {
    const newSelected = new Set(selectedEvents)
    if (newSelected.has(eventType)) {
      newSelected.delete(eventType)
    } else {
      newSelected.add(eventType)
    }
    setSelectedEvents(newSelected)
  }

  const handleSubmit = () => {
    if (!url?.startsWith('https://')) {
      toast.show({
        message: 'Webhook URL must start with https://',
        variant: 'error',
      })
      return
    }

    if (selectedEvents.size === 0) {
      toast.show({
        message: 'Select at least one event type',
        variant: 'error',
      })
      return
    }

    createWebhook.mutate({
      url,
      description,
      events: Array.from(selectedEvents),
    })
  }

  // Group events by category
  const eventsByCategory = eventTypes.reduce(
    (acc, event) => {
      if (!acc[event.category]) {
        acc[event.category] = []
      }
      acc[event.category].push(event)
      return acc
    },
    {} as Record<string, typeof eventTypes>
  )

  if (secret) {
    // Show secret after creation
    return (
      <OfficeLayout
        showBreadcrumb
        breadcrumbItems={[
          { label: 'Office', href: ROUTES.OFFICE.path },
          { label: 'Webhooks', href: ROUTES.OFFICE.WEBHOOKS.path },
          { label: 'Created', href: ROUTES.OFFICE.WEBHOOKS.CREATE.path },
        ]}
        leftContent={
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
                  <Button
                    variant="filled"
                    color="primary"
                    onPress={() => router.push(ROUTES.OFFICE.WEBHOOKS.path)}
                  >
                    I've saved my secret
                  </Button>
                </Row>
              </Stack>
            </Card>
          </Stack>
        }
      />
    )
  }

  return (
    <OfficeLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Office', href: ROUTES.OFFICE.path },
        { label: 'Webhooks', href: ROUTES.OFFICE.WEBHOOKS.path },
        { label: 'Create', href: ROUTES.OFFICE.WEBHOOKS.CREATE.path },
      ]}
      leftContent={
        // OfficeLayout scrolls and supplies the gutter; this paid both twice
        // (#1098). Create Webhook was the default near-black fill (#1105).
        <Stack gap={16}>
          <ScreenHeader
            kicker="Developers"
            title="Create webhook"
            actions={
              <Row gap={8}>
                <Button
                  variant="outline"
                  onPress={() => router.back()}
                  disabled={createWebhook.isPending}
                >
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

          {/* Endpoint Configuration */}
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

          {/* Event Selection */}
          <Card padding="lg">
            <Stack gap={20}>
              <Text>Event Subscriptions *</Text>
              <Text color="secondary">Select the events you want to receive notifications for</Text>

              {eventTypesLoading ? (
                <Text color="secondary">Loading events...</Text>
              ) : eventTypesFailed || eventTypes.length === 0 ? (
                // A failed catalog is not "nothing to subscribe to": the
                // missing route behind #1085 rendered as a blank card.
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
                          <Pressable
                            key={event.value}
                            onPress={() => handleToggleEvent(event.value as WebhookEventType)}
                          >
                            <Row gap={12} align="center" padding="sm">
                              <Checkbox
                                checked={selectedEvents.has(event.value as WebhookEventType)}
                                onChange={() => handleToggleEvent(event.value as WebhookEventType)}
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
                {selectedEvents.size} event
                {selectedEvents.size !== 1 ? 's' : ''} selected
              </Text>
            </Stack>
          </Card>

          {/* Configuration Info */}
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
      }
    />
  )
}
