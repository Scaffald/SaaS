/** Display helpers shared by the webhook list and detail screens (#1440). */

type DeliveryCounts = {
  total_deliveries?: number | null
  successful_deliveries?: number | null
}

/** "87%", or "N/A" for a webhook that has never delivered. */
export function webhookSuccessRate(webhook: DeliveryCounts): string {
  const total = webhook.total_deliveries ?? 0
  if (total <= 0) return 'N/A'
  return `${Math.round(((webhook.successful_deliveries ?? 0) / total) * 100)}%`
}

export type DeliveryTone = 'success' | 'warning' | 'error' | 'default'

/** The badge colour for a delivery's status. */
export function deliveryTone(status: string | null | undefined): DeliveryTone {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'error'
    case 'pending':
    case 'retrying':
      return 'warning'
    default:
      return 'default'
  }
}
