/**
 * Webhooks Management Page
 * Developer Portal page for managing webhook endpoints
 */

import { useState } from 'react'
import { Link, useRouter } from 'expo-router'
import { ScrollView } from 'react-native'
import { api } from '@scf/core/utils/api'
import { OfficePageLayout } from '@scf/core/features/office/components/OfficePageLayout'
import { Button, Card, Badge, Row, Stack, Text } from '@unicornlove/beyond-ui'
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
          <Button variant="filled" size="md">Create Webhook</Button>
        </Link>
      }
    >
      <ScrollView padding={16}>
        {/* Documentation Banner */}
        <Card padding={20}>
          <Stack gap={12}>
            <Text>Getting Started with Webhooks</Text>
            <Text color="$gray11">
              Webhooks allow you to receive real-time notifications when events occur in your
              organization. Configure endpoints to receive POST requests when jobs are created,
              applications are submitted, and more.
            </Text>
            <Row pressStyle={{ opacity: 0.7 }} cursor="pointer">
              <Text color="$blue10">View Documentation →</Text>
            </Row>
          </Stack>
        </Card>

        {/* Webhooks List */}
        {isLoading ? (
          <Stack padding={32} align="center" justify="center">
            <Text color="$gray11">Loading webhooks...</Text>
          </Stack>
        ) : webhooks.length === 0 ? (
          <Card padding={32} align="center" gap={16}>
            <Text>No webhooks configured</Text>
            <Text color="$gray11" maxWidth={400}>
              Create your first webhook endpoint to start receiving real-time event notifications.
            </Text>
            <Link href={ROUTES.OFFICE.WEBHOOKS.CREATE.path} asChild>
              <Button variant="filled" size="md">Create Your First Webhook</Button>
            </Link>
          </Card>
        ) : (
          <Stack gap={12}>
            {webhooks.map((webhook: WebhookConfig) => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                isSelected={selectedWebhook === webhook.id}
                onPress={() => setSelectedWebhook(webhook.id)}
                onViewDetails={() => router.push(buildPath(ROUTES.OFFICE.WEBHOOKS.DETAIL, { id: webhook.id }))}
              />
            ))}
          </Stack>
        )}

        {/* Event Types Reference */}
        {webhooks.length > 0 && (
          <Card padding={20}>
            <Text>Available Event Types</Text>
            <Text color="$gray11">
              Subscribe to these events to receive notifications:
            </Text>
            <Row gap={8}>
              <EventTypeBadge label="job.created" category="Jobs" />
              <EventTypeBadge label="job.published" category="Jobs" />
              <EventTypeBadge label="application.submitted" category="Applications" />
              <EventTypeBadge label="application.accepted" category="Applications" />
              <EventTypeBadge label="inquiry.created" category="Inquiries" />
              <EventTypeBadge label="background_check.completed" category="Background Checks" />
            </Row>
            <Row pressStyle={{ opacity: 0.7 }} cursor="pointer">
              <Text color="$blue10">View All Event Types →</Text>
            </Row>
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
      padding={16}
      borderWidth={2}
      borderColor={isSelected ? '$blue8' : '$borderColor'}
      backgroundColor={isSelected ? '$blue2' : '$background'}
      pressStyle={{ scale: 0.98 }}
      onPress={onPress}
      cursor="pointer"
    >
      <Stack gap={16}>
        <Stack gap={8}>
          <Row gap={12} align="center" justify="space-between">
            <Text>{webhook.url}</Text>
            <Badge
              variant={webhook.is_active ? 'success' : 'neutral'}
              label={webhook.is_active ? 'Active' : 'Inactive'}
            />
          </Row>
          {webhook.description && (
            <Text color="$gray11" numberOfLines={2}>
              {webhook.description}
            </Text>
          )}
        </Stack>

        <Row gap={24}>
          <Stack gap={4}>
            <Text color="$gray11">Events</Text>
            <Text>{webhook.events.length}</Text>
          </Stack>
          <Stack gap={4}>
            <Text color="$gray11">Success Rate</Text>
            <Text>
              {webhook.total_deliveries > 0
                ? `${Math.round((webhook.successful_deliveries / webhook.total_deliveries) * 100)}%`
                : 'N/A'}
            </Text>
          </Stack>
          <Stack gap={4}>
            <Text color="$gray11">Last Delivery</Text>
            <Text>
              {webhook.last_delivery_at
                ? new Date(webhook.last_delivery_at).toLocaleDateString()
                : 'Never'}
            </Text>
          </Stack>
        </Row>

        <Row>
          <Button variant="ghost" size="sm" onPress={onViewDetails}>View Details</Button>
        </Row>
      </Stack>
    </Card>
  )
}

interface EventTypeBadgeProps {
  label: string
  category: string
}

function EventTypeBadge({ label, category }: EventTypeBadgeProps) {
  return (
    <Stack padding={8} paddingHorizontal={12} backgroundColor="$gray3" borderRadius={12} gap={4}>
      <Text fontFamily="monospace" color="$gray12">{label}</Text>
      <Text color="$gray10">{category}</Text>
    </Stack>
  )
}
