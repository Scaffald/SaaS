/**
 * Webhooks Management Page
 * Developer Portal page for managing webhook endpoints
 */

import { useState } from 'react'
import { Link, useRouter } from 'expo-router'
import { ScrollView } from 'react-native'
import { useWebhooks } from '@scf/core/utils/webhooks-sdk-hooks'
import { OfficePageLayout } from '@scf/core/features/office/components/OfficePageLayout'
import { Button, Card, Row, Stack, Text } from '@scaffald/ui'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import type { Webhook } from '@scaffald/sdk/types/webhooks-management'

export default function WebhooksPage() {
  const router = useRouter()
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null)

  // Fetch webhooks
  const { data: webhooksData, isLoading } = useWebhooks()

  const webhooks = webhooksData?.data ?? []

  return (
    <OfficePageLayout
      title="Webhooks"
      breadcrumbs={[
        { label: 'Office', href: ROUTES.OFFICE.path },
        { label: 'Webhooks', href: ROUTES.OFFICE.WEBHOOKS.path },
      ]}
      actions={
        <Link href={ROUTES.OFFICE.WEBHOOKS.CREATE.path} asChild>
          <Button variant="filled" size="md">
            Create Webhook
          </Button>
        </Link>
      }
    >
      <ScrollView padding={16}>
        {/* Documentation Banner */}
        <Card padding="lg">
          <Stack gap={12}>
            <Text>Getting Started with Webhooks</Text>
            <Text color="$gray11">
              Webhooks allow you to receive real-time notifications when events occur in your
              organization. Configure endpoints to receive POST requests when jobs are created,
              applications are submitted, and more.
            </Text>
            <Row pressStyle={{ opacity: 0.7 }}>
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
            <Text color="$gray11" style={{ maxWidth: 400 }}>
              Create your first webhook endpoint to start receiving real-time event notifications.
            </Text>
            <Link href={ROUTES.OFFICE.WEBHOOKS.CREATE.path} asChild>
              <Button variant="filled" size="md">
                Create Your First Webhook
              </Button>
            </Link>
          </Card>
        ) : (
          <Stack gap={12}>
            {webhooks.map((webhook: Webhook) => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                isSelected={selectedWebhook === webhook.id}
                onPress={() => setSelectedWebhook(webhook.id)}
                onViewDetails={() =>
                  router.push(buildPath(ROUTES.OFFICE.WEBHOOKS.DETAIL, { id: webhook.id }))
                }
              />
            ))}
          </Stack>
        )}

        {/* Event Types Reference */}
        {webhooks.length > 0 && (
          <Card padding="lg">
            <Text>Available Event Types</Text>
            <Text color="$gray11">Subscribe to these events to receive notifications:</Text>
            <Row gap={8}>
              <EventTypeBadge label="job.created" category="Jobs" />
              <EventTypeBadge label="job.published" category="Jobs" />
              <EventTypeBadge label="application.submitted" category="Applications" />
              <EventTypeBadge label="application.accepted" category="Applications" />
              <EventTypeBadge label="inquiry.created" category="Inquiries" />
              <EventTypeBadge label="background_check.completed" category="Background Checks" />
            </Row>
            <Row pressStyle={{ opacity: 0.7 }}>
              <Text color="$blue10">View All Event Types →</Text>
            </Row>
          </Card>
        )}
      </ScrollView>
    </OfficePageLayout>
  )
}

interface WebhookCardProps {
  webhook: Webhook & {
    total_deliveries?: number
    successful_deliveries?: number
    last_delivery_at?: string
  }
  isSelected: boolean
  onPress: () => void
  onViewDetails: () => void
}

function WebhookCard({
  webhook,
  isSelected: _isSelected,
  onPress,
  onViewDetails,
}: WebhookCardProps) {
  return (
    <Card padding={16} pressStyle={{ scale: 0.98 }} onPress={onPress}>
      <Stack gap={16}>
        <Stack gap={8}>
          <Row gap={12} align="center" justify="space-between">
            <Text>{webhook.url}</Text>
            <Text
              size="sm"
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                backgroundColor: webhook.is_active ? '#10b981' : '#6b7280',
                color: '#ffffff',
              }}
            >
              {webhook.is_active ? 'Active' : 'Inactive'}
            </Text>
          </Row>
          {webhook.description && <Text color="$gray11">{webhook.description}</Text>}
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
          <Button variant="text" size="sm" onPress={onViewDetails}>
            View Details
          </Button>
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
    <Stack padding={8} gap={4}>
      <Text style={{ fontFamily: 'monospace' }} color="$gray12">
        {label}
      </Text>
      <Text color="$gray10">{category}</Text>
    </Stack>
  )
}
