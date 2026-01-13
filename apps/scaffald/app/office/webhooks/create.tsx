/**
 * Create Webhook Page
 * Form for creating a new webhook endpoint
 */

import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, Alert } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { api } from '@scf/core/utils/api'
import { OfficePageLayout } from '@scf/core/features/office/components/OfficePageLayout'
import { Button, Card, Checkbox, colors, spacing, typography } from '@unicornlove/ui'
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
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <Card style={styles.secretCard}>
            <Text style={styles.secretTitle}>⚠️ Save Your Webhook Secret</Text>
            <Text style={styles.secretWarning}>
              This is the only time you will see this secret. Store it securely.
            </Text>

            <View style={styles.secretBox}>
              <Text style={styles.secretText} selectable>
                {secret}
              </Text>
            </View>

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
        <View style={styles.headerActions}>
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
        </View>
      }
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Endpoint Configuration */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Endpoint Configuration</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Endpoint URL *</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://api.example.com/webhooks"
              placeholderTextColor={colors.text.light.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.fieldHint}>
              Must be a valid HTTPS URL. Your endpoint will receive POST requests.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Production webhook for order notifications"
              placeholderTextColor={colors.text.light.tertiary}
              multiline
              numberOfLines={3}
            />
          </View>
        </Card>

        {/* Event Selection */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Event Subscriptions *</Text>
          <Text style={styles.sectionDescription}>
            Select the events you want to receive notifications for
          </Text>

          <View style={styles.eventCategories}>
            {Object.entries(eventsByCategory).map(([category, events]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <View style={styles.eventsList}>
                  {events.map((event) => (
                    <Pressable
                      key={event.value}
                      style={styles.eventItem}
                      onPress={() => handleToggleEvent(event.value as WebhookEventType)}
                    >
                      <Checkbox
                        checked={selectedEvents.has(event.value as WebhookEventType)}
                        onChange={() => handleToggleEvent(event.value as WebhookEventType)}
                      />
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventLabel}>{event.value}</Text>
                        <Text style={styles.eventDescription}>{event.label}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.selectedCount}>
            {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
          </Text>
        </Card>

        {/* Configuration Info */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Configuration Details</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Max Retries:</Text>
              <Text style={styles.infoValue}>3 attempts</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Retry Backoff:</Text>
              <Text style={styles.infoValue}>1min, 5min, 15min</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Timeout:</Text>
              <Text style={styles.infoValue}>10 seconds</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Signature:</Text>
              <Text style={styles.infoValue}>HMAC-SHA256</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </OfficePageLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[24],
    gap: spacing[24],
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[12],
  },
  section: {
    padding: spacing[20],
    gap: spacing[20],
  },
  sectionTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
  },
  sectionDescription: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.secondary,
  },
  field: {
    gap: spacing[8],
  },
  fieldLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light.default,
    borderRadius: 8,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[10],
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.text.light.primary,
    backgroundColor: colors.bg.light.default,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldHint: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.text.light.tertiary,
  },
  eventCategories: {
    gap: spacing[24],
    marginTop: spacing[12],
  },
  categorySection: {
    gap: spacing[12],
  },
  categoryTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventsList: {
    gap: spacing[8],
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    padding: spacing[12],
    backgroundColor: colors.bg.light.subtle,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light[200],
  },
  eventInfo: {
    flex: 1,
    gap: spacing[4],
  },
  eventLabel: {
    fontFamily: 'monospace',
    fontSize: typography.small.fontSize,
    color: colors.text.light.primary,
  },
  eventDescription: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.caption.fontSize,
    color: colors.text.light.secondary,
  },
  selectedCount: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.tertiary,
    marginTop: spacing[8],
  },
  infoCard: {
    padding: spacing[20],
    backgroundColor: colors.bg.light[50],
  },
  infoTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
    marginBottom: spacing[12],
  },
  infoList: {
    gap: spacing[8],
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    color: colors.text.light.secondary,
  },
  infoValue: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.text.light.primary,
  },
  secretCard: {
    padding: spacing[32],
    gap: spacing[20],
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    borderWidth: 2,
    borderColor: colors.warning[500],
  },
  secretTitle: {
    fontFamily: typography.h6.fontFamily,
    fontSize: typography.h6.fontSize,
    fontWeight: typography.h6.fontWeight,
    color: colors.text.light.primary,
    textAlign: 'center',
  },
  secretWarning: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.text.light.secondary,
    textAlign: 'center',
    maxWidth: 400,
  },
  secretBox: {
    width: '100%',
    backgroundColor: colors.bg.light.default,
    borderWidth: 1,
    borderColor: colors.border.light.default,
    borderRadius: 8,
    padding: spacing[16],
  },
  secretText: {
    fontFamily: 'monospace',
    fontSize: typography.body.fontSize,
    color: colors.text.light.primary,
    textAlign: 'center',
  },
})
