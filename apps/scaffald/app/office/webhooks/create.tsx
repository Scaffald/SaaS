/**
 * Create Webhook Page
 * Form for creating a new webhook endpoint
 */

import { Alert } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { ScrollView } from 'react-native'
import { api } from '@scf/core/utils/api'
import { OfficePageLayout } from '@scf/core/features/office/components/OfficePageLayout'
import { Button, Card, Checkbox, Row, Stack, Text, Input, TextArea } from '@unicornlove/beyond-ui'
import { ROUTES } from '@scf/core/constants/routes'
import type { WebhookEventType } from '@scf/schemas'

export default function CreateWebhookPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<Set<WebhookEventType>>(new Set())
  const [secret, setSecret] = useState('')

  // Fetch available event types
  const { data: eventTypesData } = api.webhooks.eventTypes.useQuery()
  const eventTypes = eventTypesData?.data ?? []

  // Create webhook mutation
  const createWebhook = api.webhooks.create.useMutation({
    onSuccess: (data) => {
      // Show secret once
      setSecret(data.data.secret)
      Alert.alert(
        'Webhook Created',
        'Your webhook has been created successfully. Make sure to save your secret key - it will not be shown again!',
        [
          {
            text: 'Copy Secret & Continue',
            onPress: () => {
              // TODO: Implement clipboard copy
              router.push(ROUTES.OFFICE.WEBHOOKS.path)
            },
          },
        ]
      )
    },
    onError: (error) => {
      Alert.alert('Error', error.message)
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
    if (!url || !url.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Webhook URL must start with https://')
      return
    }

    if (selectedEvents.size === 0) {
      Alert.alert('No Events Selected', 'Please select at least one event type')
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
      <OfficePageLayout
        title="Webhook Created"
        description="Save your webhook secret"
        breadcrumbs={[
          { label: 'Office', href: ROUTES.OFFICE.path },
          { label: 'Webhooks', href: ROUTES.OFFICE.WEBHOOKS.path },
          { label: 'Created', href: ROUTES.OFFICE.WEBHOOKS.CREATE.path },
        ]}
      >
        <ScrollView padding={16}>
          <Card padding={32} gap={20} align="center" backgroundColor="$yellow2" borderColor="$yellow8" borderWidth={2}>
            <Text>
              ⚠️ Save Your Webhook Secret
            </Text>
            <Text color="$gray11" maxWidth={400}>
              This is the only time you will see this secret. Store it securely.
            </Text>

            <Stack width="100%" backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius={16} padding={16}>
              <Text fontFamily="monospace" selectable>
                {secret}
              </Text>
            </Stack>

            <Button variant="filled" size="md" onPress={() => router.push(ROUTES.OFFICE.WEBHOOKS.path)}>I've Saved My Secret</Button>
          </Card>
        </ScrollView>
      </OfficePageLayout>
    )
  }

  return (
    <OfficePageLayout
      title="Create Webhook"
      description="Configure a new webhook endpoint"
      breadcrumbs={[
        { label: 'Office', href: ROUTES.OFFICE.path },
        { label: 'Webhooks', href: ROUTES.OFFICE.WEBHOOKS.path },
        { label: 'Create', href: ROUTES.OFFICE.WEBHOOKS.CREATE.path },
      ]}
      actions={
        <Row gap={12}>
          <Button
            variant="ghost"
            size="md"
            onPress={() => router.back()}
            disabled={createWebhook.isPending}
          >Cancel</Button>
          <Button
            variant="filled"
            size="md"
            onPress={handleSubmit}
            disabled={createWebhook.isPending}
          >{createWebhook.isPending ? 'Creating...' : 'Create Webhook'}</Button>
        </Row>
      }
    >
      <ScrollView padding={16}>
        {/* Endpoint Configuration */}
        <Card padding={20} gap={20}>
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
            <Text color="$gray10">
              Must be a valid HTTPS URL. Your endpoint will receive POST requests.
            </Text>
          </Stack>

          <Stack gap={8}>
            <Text>Description (Optional)</Text>
            <TextArea
              value={description}
              onChangeText={setDescription}
              placeholder="Production webhook for order notifications"
              numberOfLines={3}
            />
          </Stack>
        </Card>

        {/* Event Selection */}
        <Card padding={20} gap={20}>
          <Text>Event Subscriptions *</Text>
          <Text color="$gray11">
            Select the events you want to receive notifications for
          </Text>

          <Stack gap={24}>
            {Object.entries(eventsByCategory).map(([category, events]) => (
              <Stack key={category} gap={12}>
                <Text color="$gray11" letterSpacing={0.5}>
                  {category}
                </Text>
                <Stack gap={8}>
                  {events.map((event) => (
                    <Row
                      key={event.value}
                      gap={12}
                      align="center"
                      padding={12}
                      backgroundColor="$gray2"
                      borderRadius={16}
                      borderWidth={1}
                      borderColor="$gray4"
                      pressStyle={{ backgroundColor: '$gray3' }}
                      onPress={() => handleToggleEvent(event.value as WebhookEventType)}
                      cursor="pointer"
                    >
                      <Checkbox
                        checked={selectedEvents.has(event.value as WebhookEventType)}
                        onChange={() => handleToggleEvent(event.value as WebhookEventType)}
                      />
                      <Stack gap={4}>
                        <Text fontFamily="monospace">{event.value}</Text>
                        <Text color="$gray11">{event.label}</Text>
                      </Stack>
                    </Row>
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>

          <Text color="$gray10">
            {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
          </Text>
        </Card>

        {/* Configuration Info */}
        <Card padding={20} backgroundColor="$gray2">
          <Text>
            Configuration Details
          </Text>
          <Stack gap={8}>
            <Row justify="space-between">
              <Text color="$gray11">Max Retries:</Text>
              <Text>3 attempts</Text>
            </Row>
            <Row justify="space-between">
              <Text color="$gray11">Retry Backoff:</Text>
              <Text>1min, 5min, 15min</Text>
            </Row>
            <Row justify="space-between">
              <Text color="$gray11">Timeout:</Text>
              <Text>10 seconds</Text>
            </Row>
            <Row justify="space-between">
              <Text color="$gray11">Signature:</Text>
              <Text>HMAC-SHA256</Text>
            </Row>
          </Stack>
        </Card>
      </ScrollView>
    </OfficePageLayout>
  )
}
