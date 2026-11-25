import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react-native'
import { Button, Card, Row, ScreenHeader, Spinner, Stack, Text, useToast } from '@scaffald/ui'
import type { WebhookDelivery } from '@scaffald/sdk'
import { LoadFailure, StatusBadge } from '@scf/core/components/ui'
import { RouteBuilder } from '@scf/core/constants/routes'
import { confirmDialog } from '@scf/core/utils/platform'
import {
  useDeleteWebhookMutation,
  useWebhook,
  useWebhookDeliveries,
} from '@scf/core/utils/webhooks-sdk-hooks'
import { deliveryTone, webhookSuccessRate } from './webhook-format'

const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : '—'

/**
 * One webhook (#1440). The list row always pushed to a detail route, but no
 * screen existed behind it, so every tap was a 404. Shows the endpoint, its
 * events and recent deliveries; an organization admin can delete it.
 */
export function WebhookDetailScreen({
  id,
  organizationId,
  slug,
  canManage,
}: {
  id: string
  organizationId: string
  slug: string
  canManage: boolean
}) {
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error, refetch } = useWebhook(id)
  const deliveries = useWebhookDeliveries(id, { limit: 20 })
  const backToList = () => router.push(RouteBuilder.orgWebhooks(slug))

  const deleteWebhook = useDeleteWebhookMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', 'list'] })
      toast.show({ message: 'Webhook deleted', variant: 'success' })
      backToList()
    },
    onError: (err) => toast.show({ message: err.message, variant: 'error' }),
  })

  if (isLoading) {
    return (
      <Stack padding="xl" align="center" justify="center">
        <Spinner size="lg" />
      </Stack>
    )
  }

  const webhook = data?.data
  // The api answers 404 for a webhook outside the caller's organizations. One
  // that belongs to a different organization of theirs is not this tab's.
  if (isError || !webhook || webhook.organization_id !== organizationId) {
    return (
      <LoadFailure
        error={isError ? error : { statusCode: 404 }}
        noun="webhook"
        retry={isError ? () => refetch() : undefined}
        back={{ label: 'Webhooks', href: RouteBuilder.orgWebhooks(slug) }}
      />
    )
  }

  const handleDelete = async () => {
    const ok = await confirmDialog({
      title: 'Delete webhook?',
      message: `Deliveries to ${webhook.url} stop at once. This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) deleteWebhook.mutate(webhook.id)
  }

  const rows = deliveries.data?.data ?? []

  return (
    <Stack gap={16}>
      <ScreenHeader
        kicker="Webhook"
        title={webhook.url}
        tip={webhook.description ?? undefined}
        back={{ label: 'Webhooks', onPress: backToList }}
        actions={
          canManage ? (
            <Button
              variant="outline"
              color="error"
              iconStart={Trash2}
              onPress={handleDelete}
              disabled={deleteWebhook.isPending}
            >
              {deleteWebhook.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          ) : undefined
        }
      />

      <Card padding="lg">
        <Stack gap={12}>
          <Row justify="space-between" align="center">
            <Text>Status</Text>
            <StatusBadge variant={webhook.is_active ? 'success' : 'default'}>
              {webhook.is_active ? 'Active' : 'Inactive'}
            </StatusBadge>
          </Row>
          <Row justify="space-between">
            <Text color="secondary">Success rate</Text>
            <Text>{webhookSuccessRate(webhook)}</Text>
          </Row>
          <Row justify="space-between">
            <Text color="secondary">Deliveries</Text>
            <Text>
              {webhook.total_deliveries ?? 0} total · {webhook.failed_deliveries ?? 0} failed
            </Text>
          </Row>
          <Row justify="space-between">
            <Text color="secondary">Last delivery</Text>
            <Text>{formatDateTime(webhook.last_delivery_at)}</Text>
          </Row>
          <Row justify="space-between">
            <Text color="secondary">Retries · timeout</Text>
            <Text>
              {webhook.retry_max_attempts} · {Math.round(webhook.timeout_ms / 1000)}s
            </Text>
          </Row>
          <Row justify="space-between">
            <Text color="secondary">Created</Text>
            <Text>{formatDateTime(webhook.created_at)}</Text>
          </Row>
        </Stack>
      </Card>

      <Card padding="lg">
        <Stack gap={12}>
          <Text>Events</Text>
          <Row gap={8} wrap>
            {webhook.events.map((event) => (
              <StatusBadge key={event}>{event}</StatusBadge>
            ))}
          </Row>
        </Stack>
      </Card>

      <Card padding="lg">
        <Stack gap={12}>
          <Text>Recent deliveries</Text>
          {deliveries.isLoading ? (
            <Spinner />
          ) : deliveries.isError ? (
            <Text color="secondary">Deliveries did not load.</Text>
          ) : rows.length === 0 ? (
            <Text color="secondary">Nothing has been delivered to this endpoint yet.</Text>
          ) : (
            rows.map((delivery) => <DeliveryRow key={delivery.id} delivery={delivery} />)
          )}
        </Stack>
      </Card>
    </Stack>
  )
}

function DeliveryRow({ delivery }: { delivery: WebhookDelivery }) {
  return (
    <Row gap={12} align="center" justify="space-between" wrap>
      <Stack gap={2} style={{ flexShrink: 1 }}>
        <Text style={{ fontFamily: 'monospace' }}>{delivery.event_type}</Text>
        <Text color="tertiary">{formatDateTime(delivery.created_at)}</Text>
      </Stack>
      <Row gap={8} align="center">
        {delivery.response_status_code ? (
          <Text color="secondary">HTTP {delivery.response_status_code}</Text>
        ) : null}
        <StatusBadge variant={deliveryTone(delivery.status)}>{delivery.status}</StatusBadge>
      </Row>
    </Row>
  )
}
