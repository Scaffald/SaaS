/**
 * Create Webhook Page
 * Form for creating a new webhook endpoint
 */

import { Alert } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { api } from '@scf/core/utils/api'
import { OfficePageLayout } from '@scf/core/features/office/components/OfficePageLayout'
import { Button, Card, Checkbox, XStack, YStack, Text, Input, TextArea, ScrollView } from '@unicornlove/ui'
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
        <ScrollView flex={1} padding="$4">
          <Card padding="$8" gap="$5" alignItems="center" backgroundColor="$yellow2" borderColor="$yellow8" borderWidth={2}>
            <Text fontSize="$6" fontWeight="600" textAlign="center">
              ⚠️ Save Your Webhook Secret
            </Text>
            <Text fontSize="$4" color="$gray11" textAlign="center" maxWidth={400}>
              This is the only time you will see this secret. Store it securely.
            </Text>

            <YStack width="100%" backgroundColor="$background" borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$4">
              <Text fontFamily="monospace" fontSize="$4" textAlign="center" selectable>
                {secret}
              </Text>
            </YStack>

            <Button variant="primary" size="md" onPress={() => router.push(ROUTES.OFFICE.WEBHOOKS.path)}>
              I've Saved My Secret
            </Button>
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
        <XStack gap="$3">
          <Button
            variant="ghost"
            size="md"
            onPress={() => router.back()}
            disabled={createWebhook.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onPress={handleSubmit}
            disabled={createWebhook.isPending}
          >
            {createWebhook.isPending ? 'Creating...' : 'Create Webhook'}
          </Button>
        </XStack>
      }
    >
      <ScrollView flex={1} padding="$4">
        {/* Endpoint Configuration */}
        <Card padding="$5" gap="$5" marginBottom="$4">
          <Text fontSize="$5" fontWeight="500">Endpoint Configuration</Text>

          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="500">Endpoint URL *</Text>
            <Input
              value={url}
              onChangeText={setUrl}
              placeholder="https://api.example.com/webhooks"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text fontSize="$2" color="$gray10">
              Must be a valid HTTPS URL. Your endpoint will receive POST requests.
            </Text>
          </YStack>

          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="500">Description (Optional)</Text>
            <TextArea
              value={description}
              onChangeText={setDescription}
              placeholder="Production webhook for order notifications"
              numberOfLines={3}
            />
          </YStack>
        </Card>

        {/* Event Selection */}
        <Card padding="$5" gap="$5" marginBottom="$4">
          <Text fontSize="$5" fontWeight="500">Event Subscriptions *</Text>
          <Text fontSize="$3" color="$gray11">
            Select the events you want to receive notifications for
          </Text>

          <YStack gap="$6" marginTop="$3">
            {Object.entries(eventsByCategory).map(([category, events]) => (
              <YStack key={category} gap="$3">
                <Text fontSize="$3" fontWeight="500" color="$gray11" textTransform="uppercase" letterSpacing={0.5}>
                  {category}
                </Text>
                <YStack gap="$2">
                  {events.map((event) => (
                    <XStack
                      key={event.value}
                      gap="$3"
                      alignItems="center"
                      padding="$3"
                      backgroundColor="$gray2"
                      borderRadius="$4"
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
                      <YStack flex={1} gap="$1">
                        <Text fontFamily="monospace" fontSize="$3">{event.value}</Text>
                        <Text fontSize="$2" color="$gray11">{event.label}</Text>
                      </YStack>
                    </XStack>
                  ))}
                </YStack>
              </YStack>
            ))}
          </YStack>

          <Text fontSize="$3" fontWeight="500" color="$gray10" marginTop="$2">
            {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
          </Text>
        </Card>

        {/* Configuration Info */}
        <Card padding="$5" backgroundColor="$gray2">
          <Text fontSize="$3" fontWeight="500" marginBottom="$3">
            Configuration Details
          </Text>
          <YStack gap="$2">
            <XStack justifyContent="space-between">
              <Text fontSize="$3" color="$gray11">Max Retries:</Text>
              <Text fontSize="$3" fontWeight="500">3 attempts</Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Text fontSize="$3" color="$gray11">Retry Backoff:</Text>
              <Text fontSize="$3" fontWeight="500">1min, 5min, 15min</Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Text fontSize="$3" color="$gray11">Timeout:</Text>
              <Text fontSize="$3" fontWeight="500">10 seconds</Text>
            </XStack>
            <XStack justifyContent="space-between">
              <Text fontSize="$3" color="$gray11">Signature:</Text>
              <Text fontSize="$3" fontWeight="500">HMAC-SHA256</Text>
            </XStack>
          </YStack>
        </Card>
      </ScrollView>
    </OfficePageLayout>
  )
}
