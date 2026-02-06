/**
 * Webhooks Management Page
 * Developer Portal page for managing webhook endpoints
 */

import { useState } from 'react'
import { Link, useRouter } from 'expo-router'
import { api } from '@scf/core/utils/api'
import { OfficePageLayout } from '@scf/core/features/office/components/OfficePageLayout'
import { Button, Card, Badge, XStack, YStack, Text, ScrollView } from '@unicornlove/ui'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import type { WebhookConfig } from '@scf/schemas'

export default function WebhooksPage() {
  const router = useRouter()
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null)

  // Fetch webhooks
  const { data: webhooksData, isLoading } = api.webhooks.list.useQuery()

  const webhooks = webhooksData?.data ?? []

  return (
    <OfficePageLayout
      title="Webhooks"
      description="Manage webhook endpoints for real-time event notifications"
      breadcrumbs={[
        { label: 'Office', href: ROUTES.OFFICE.path },
        { label: 'Webhooks', href: ROUTES.OFFICE.WEBHOOKS.path },
      ]}
      actions={
        <Link href={ROUTES.OFFICE.WEBHOOKS.CREATE.path} asChild>
          <Button variant="primary" size="md">
            Create Webhook
          </Button>
        </Link>
      }
    >
      <ScrollView flex={1} padding="$4">
        {/* Documentation Banner */}
        <Card padding="$5" marginBottom="$4">
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="600">Getting Started with Webhooks</Text>
            <Text fontSize="$4" color="$gray11" lineHeight="$4">
              Webhooks allow you to receive real-time notifications when events occur in your
              organization. Configure endpoints to receive POST requests when jobs are created,
              applications are submitted, and more.
            </Text>
            <XStack pressStyle={{ opacity: 0.7 }} cursor="pointer">
              <Text fontSize="$4" color="$blue10" fontWeight="500">View Documentation →</Text>
            </XStack>
          </YStack>
        </Card>

        {/* Webhooks List */}
        {isLoading ? (
          <YStack padding="$8" alignItems="center" justifyContent="center">
            <Text fontSize="$4" color="$gray11">Loading webhooks...</Text>
          </YStack>
        ) : webhooks.length === 0 ? (
          <Card padding="$8" alignItems="center" gap="$4">
            <Text fontSize="$6" fontWeight="600">No webhooks configured</Text>
            <Text fontSize="$4" color="$gray11" textAlign="center" maxWidth={400}>
              Create your first webhook endpoint to start receiving real-time event notifications.
            </Text>
            <Link href={ROUTES.OFFICE.WEBHOOKS.CREATE.path} asChild>
              <Button variant="primary" size="md" marginTop="$4">
                Create Your First Webhook
              </Button>
            </Link>
          </Card>
        ) : (
          <YStack gap="$3">
            {webhooks.map((webhook: WebhookConfig) => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                isSelected={selectedWebhook === webhook.id}
                onPress={() => setSelectedWebhook(webhook.id)}
                onViewDetails={() => router.push(buildPath(ROUTES.OFFICE.WEBHOOKS.DETAIL, { id: webhook.id }))}
              />
            ))}
          </YStack>
        )}

        {/* Event Types Reference */}
        {webhooks.length > 0 && (
          <Card padding="$5" marginTop="$4">
            <Text fontSize="$5" fontWeight="600" marginBottom="$2">Available Event Types</Text>
            <Text fontSize="$4" color="$gray11" marginBottom="$4">
              Subscribe to these events to receive notifications:
            </Text>
            <XStack flexWrap="wrap" gap="$2" marginBottom="$4">
              <EventTypeBadge label="job.created" category="Jobs" />
              <EventTypeBadge label="job.published" category="Jobs" />
              <EventTypeBadge label="application.submitted" category="Applications" />
              <EventTypeBadge label="application.accepted" category="Applications" />
              <EventTypeBadge label="inquiry.created" category="Inquiries" />
              <EventTypeBadge label="background_check.completed" category="Background Checks" />
            </XStack>
            <XStack pressStyle={{ opacity: 0.7 }} cursor="pointer">
              <Text fontSize="$4" color="$blue10" fontWeight="500">View All Event Types →</Text>
            </XStack>
          </Card>
        )}
      </ScrollView>
    </OfficePageLayout>
  )
}

interface WebhookCardProps {
  webhook: WebhookConfig
  isSelected: boolean
  onPress: () => void
  onViewDetails: () => void
}

function WebhookCard({ webhook, isSelected, onPress, onViewDetails }: WebhookCardProps) {
  return (
    <Card
      padding="$4"
      borderWidth={2}
      borderColor={isSelected ? '$blue8' : '$borderColor'}
      backgroundColor={isSelected ? '$blue2' : '$background'}
      pressStyle={{ scale: 0.98 }}
      onPress={onPress}
      cursor="pointer"
    >
      <YStack gap="$4">
        <YStack gap="$2">
          <XStack gap="$3" alignItems="center" justifyContent="space-between">
            <Text fontSize="$4" fontWeight="600" flex={1}>{webhook.url}</Text>
            <Badge
              variant={webhook.is_active ? 'success' : 'neutral'}
              label={webhook.is_active ? 'Active' : 'Inactive'}
            />
          </XStack>
          {webhook.description && (
            <Text fontSize="$3" color="$gray11" numberOfLines={2}>
              {webhook.description}
            </Text>
          )}
        </YStack>

        <XStack gap="$6">
          <YStack gap="$1">
            <Text fontSize="$2" color="$gray11">Events</Text>
            <Text fontSize="$4" fontWeight="600">{webhook.events.length}</Text>
          </YStack>
          <YStack gap="$1">
            <Text fontSize="$2" color="$gray11">Success Rate</Text>
            <Text fontSize="$4" fontWeight="600">
              {webhook.total_deliveries > 0
                ? `${Math.round((webhook.successful_deliveries / webhook.total_deliveries) * 100)}%`
                : 'N/A'}
            </Text>
          </YStack>
          <YStack gap="$1">
            <Text fontSize="$2" color="$gray11">Last Delivery</Text>
            <Text fontSize="$4" fontWeight="600">
              {webhook.last_delivery_at
                ? new Date(webhook.last_delivery_at).toLocaleDateString()
                : 'Never'}
            </Text>
          </YStack>
        </XStack>

        <XStack>
          <Button variant="ghost" size="sm" onPress={onViewDetails}>
            View Details
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}

interface EventTypeBadgeProps {
  label: string
  category: string
}

function EventTypeBadge({ label, category }: EventTypeBadgeProps) {
  return (
    <YStack padding="$2" paddingHorizontal="$3" backgroundColor="$gray3" borderRadius="$3" gap="$1">
      <Text fontFamily="monospace" fontSize="$2" color="$gray12">{label}</Text>
      <Text fontSize="$1" color="$gray10">{category}</Text>
    </YStack>
  )
}
