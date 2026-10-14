import { StatusBadge } from '@scf/core/components/ui'
/**
 * Webhooks Management Page
 * Developer Portal page for managing webhook endpoints
 */

import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Plus, Webhook as WebhookIcon } from 'lucide-react-native'
import { useWebhooks } from '@scf/core/utils/webhooks-sdk-hooks'
import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
import { Button, Card, EmptyState, ErrorState, Row, ScreenHeader, Stack, Text } from '@scaffald/ui'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import type { Webhook } from '@scaffald/sdk/types/webhooks-management'

export default function WebhooksPage() {
  const router = useRouter()
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null)

  // Fetch webhooks
  const { data: webhooksData, isLoading, isError, error, refetch } = useWebhooks()

  const webhooks = webhooksData?.data ?? []

  return (
    <OfficeLayout
      showBreadcrumb
      breadcrumbItems={[
        { label: 'Office', href: ROUTES.OFFICE.path },
        { label: 'Webhooks', href: ROUTES.OFFICE.WEBHOOKS.path },
      ]}
      leftContent={
        // No ScrollView or padding of its own: OfficeLayout scrolls and
        // supplies the gutter, so both were paid twice (#1098). The getting-
        // started banner becomes the header tip; its "View Documentation"
        // link had no destination.
        <Stack gap={16}>
          <ScreenHeader
            kicker="Developers"
            title="Webhooks"
            tip="Receive a POST request when events happen in your organization: jobs created, applications submitted, and more."
            actions={
              <Button
                variant="filled"
                color="primary"
                iconStart={Plus}
                onPress={() => router.push(ROUTES.OFFICE.WEBHOOKS.CREATE.path)}
              >
                Create Webhook
              </Button>
            }
          />

          {/* Webhooks List */}
          {isLoading ? (
            <Stack padding="xl" align="center" justify="center">
              <Text color="secondary">Loading webhooks...</Text>
            </Stack>
          ) : isError ? (
            // A failed load is not "no webhooks" — the 500 behind #1016
            // read as "Create your first webhook" for every office (#1021).
            <ErrorState
              title="Couldn’t load webhooks"
              description="Your webhooks did not load. Nothing here does not mean you have none."
              error={error as Error}
              retry={() => refetch()}
            />
          ) : webhooks.length === 0 ? (
            <EmptyState
              icon={WebhookIcon}
              title="No webhooks configured"
              description="Use Create Webhook to start receiving real-time event notifications."
            />
          ) : (
            <Stack gap={12}>
              {webhooks.map((webhook: Webhook) => (
                <WebhookCard
                  key={webhook.id}
                  webhook={webhook}
                  isSelected={selectedWebhook === webhook.id}
                  onPress={() => setSelectedWebhook(webhook.id)}
                  onViewDetails={() =>
                    router.push(
                      buildPath(
                        ROUTES.OFFICE.WEBHOOKS.DETAIL as unknown as Parameters<typeof buildPath>[0],
                        { id: webhook.id }
                      )
                    )
                  }
                />
              ))}
            </Stack>
          )}

          {/* Event Types Reference */}
          {webhooks.length > 0 && (
            <Card padding="lg">
              <Stack gap={8}>
                <Text>Available Event Types</Text>
                <Text color="secondary">Subscribe to these events to receive notifications:</Text>
                {/* Wraps: six event cells in one row ran past the card at 390. */}
                <Row gap={8} style={{ flexWrap: 'wrap' }}>
                  <EventTypeBadge label="job.created" category="Jobs" />
                  <EventTypeBadge label="job.published" category="Jobs" />
                  <EventTypeBadge label="application.submitted" category="Applications" />
                  <EventTypeBadge label="application.accepted" category="Applications" />
                  <EventTypeBadge label="inquiry.created" category="Inquiries" />
                  <EventTypeBadge label="background_check.completed" category="Background Checks" />
                </Row>
              </Stack>
            </Card>
          )}
        </Stack>
      }
    />
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
    <Card padding="md" pressable onPress={onPress}>
      <Stack gap={16}>
        <Stack gap={8}>
          <Row gap={12} align="center" justify="space-between">
            <Text style={{ flexShrink: 1 }}>{webhook.url}</Text>
            {/* The themed status badge, not hand-rolled hex — and the URL
                shrinks, so the badge is not pushed past the card at 390 (#1038). */}
            <StatusBadge variant={webhook.is_active ? 'success' : 'default'}>
              {webhook.is_active ? 'Active' : 'Inactive'}
            </StatusBadge>
          </Row>
          {webhook.description && <Text color="secondary">{webhook.description}</Text>}
        </Stack>

        <Row gap={24}>
          <Stack gap={4}>
            <Text color="secondary">Events</Text>
            <Text>{webhook.events.length}</Text>
          </Stack>
          <Stack gap={4}>
            <Text color="secondary">Success Rate</Text>
            <Text>
              {(webhook.total_deliveries ?? 0) > 0
                ? `${Math.round(
                    ((webhook.successful_deliveries ?? 0) / (webhook.total_deliveries ?? 1)) * 100
                  )}%`
                : 'N/A'}
            </Text>
          </Stack>
          <Stack gap={4}>
            <Text color="secondary">Last Delivery</Text>
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
      <Text style={{ fontFamily: 'monospace' }} color="primary">
        {label}
      </Text>
      <Text color="tertiary">{category}</Text>
    </Stack>
  )
}
