import { useRouter } from 'expo-router'
import { Plus, Webhook as WebhookIcon } from 'lucide-react-native'
import { Button, Card, EmptyState, ErrorState, Row, ScreenHeader, Spinner, Stack, Text } from '@scaffald/ui'
import type { Webhook } from '@scaffald/sdk'
import { StatusBadge } from '@scf/core/components/ui'
import { RouteBuilder } from '@scf/core/constants/routes'
import { useWebhooks } from '@scf/core/utils/webhooks-sdk-hooks'
import { webhookSuccessRate } from './webhook-format'

/**
 * One organization's webhooks (#1440). Moved from /office/webhooks, where
 * only platform staff could reach it; the list is now asked for by
 * organization, so a member of several sees each one's on its own tab.
 */
export function WebhooksListScreen({
  organizationId,
  slug,
  canManage,
}: {
  organizationId: string
  slug: string
  canManage: boolean
}) {
  const router = useRouter()
  const { data, isLoading, isError, error, refetch } = useWebhooks({
    organization_id: organizationId,
  })
  const webhooks = data?.data ?? []

  return (
    <Stack gap={16}>
      <ScreenHeader
        kicker="Developers"
        title="Webhooks"
        tip="Receive a POST request when events happen in this organization: jobs created, applications submitted, and more."
        actions={
          canManage ? (
            <Button
              variant="filled"
              color="primary"
              iconStart={Plus}
              onPress={() => router.push(RouteBuilder.orgWebhookCreate(slug))}
            >
              Create Webhook
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <Stack padding="xl" align="center" justify="center">
          <Spinner size="lg" />
        </Stack>
      ) : isError ? (
        // A failed load is not "no webhooks" — the 500 behind #1016 read as
        // "Create your first webhook" for every office (#1021).
        <ErrorState
          title="Couldn’t load webhooks"
          description="This organization’s webhooks did not load. Nothing here does not mean it has none."
          error={error as Error}
          retry={() => refetch()}
        />
      ) : webhooks.length === 0 ? (
        <EmptyState
          icon={WebhookIcon}
          title="No webhooks configured"
          description={
            canManage
              ? 'Use Create Webhook to start receiving real-time event notifications.'
              : 'An organization admin can create one.'
          }
        />
      ) : (
        <Stack gap={12}>
          {webhooks.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              webhook={webhook}
              // The row used to push /office/webhooks/:id, a route with no
              // file behind it, so every tap was a 404 (#1440).
              onPress={() => router.push(RouteBuilder.orgWebhookDetail(slug, webhook.id))}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

function WebhookCard({ webhook, onPress }: { webhook: Webhook; onPress: () => void }) {
  return (
    <Card
      padding="md"
      pressable
      onPress={onPress}
      accessibilityLabel={`Webhook ${webhook.url}`}
    >
      <Stack gap={16}>
        <Stack gap={8}>
          <Row gap={12} align="center" justify="space-between">
            <Text style={{ flexShrink: 1 }}>{webhook.url}</Text>
            {/* The URL shrinks, so the badge is not pushed past the card at 390 (#1038). */}
            <StatusBadge variant={webhook.is_active ? 'success' : 'default'}>
              {webhook.is_active ? 'Active' : 'Inactive'}
            </StatusBadge>
          </Row>
          {webhook.description ? <Text color="secondary">{webhook.description}</Text> : null}
        </Stack>

        <Row gap={24} wrap>
          <Stack gap={4}>
            <Text color="secondary">Events</Text>
            <Text>{webhook.events.length}</Text>
          </Stack>
          <Stack gap={4}>
            <Text color="secondary">Success rate</Text>
            <Text>{webhookSuccessRate(webhook)}</Text>
          </Stack>
          <Stack gap={4}>
            <Text color="secondary">Last delivery</Text>
            <Text>
              {webhook.last_delivery_at
                ? new Date(webhook.last_delivery_at).toLocaleDateString()
                : 'Never'}
            </Text>
          </Stack>
        </Row>
      </Stack>
    </Card>
  )
}
