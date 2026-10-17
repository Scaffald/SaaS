import type { PaymentAnalytics } from '@scaffald/sdk'
import type { MetricTone } from '@scaffald/ui'

export interface PaymentSummaryCard {
  label: string
  value: string
  subtext: string
  tone?: MetricTone
  emphasis?: boolean
}

export const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

/**
 * The figures across the top of payment analytics.
 *
 * With no transactions at all this read "Success rate 0.0% — 0 of 0
 * succeeded", which looks like every payment failed, beside "Failed 0 — All
 * transactions succeeded", which claims the opposite (#1174). Over zero
 * records there is no rate and nothing succeeded, so both say so instead.
 */
export function paymentSummaryCards(kpis: PaymentAnalytics['kpis']): PaymentSummaryCard[] {
  const none = kpis.totalTransactions === 0

  return [
    {
      label: 'Total Revenue',
      value: formatCurrency(kpis.totalRevenue),
      subtext: none
        ? 'No transactions yet'
        : `${kpis.succeededTransactions} successful transactions`,
    },
    {
      label: 'Success Rate',
      value: none ? '—' : `${kpis.successRate.toFixed(1)}%`,
      subtext: none
        ? 'No transactions yet'
        : `${kpis.succeededTransactions} of ${kpis.totalTransactions} succeeded`,
    },
    {
      label: 'Failed Transactions',
      value: kpis.failedTransactions.toString(),
      subtext:
        kpis.failedTransactions > 0
          ? 'Requires attention'
          : none
            ? 'No transactions yet'
            : 'None failed',
      tone: kpis.failedTransactions > 0 ? 'attention' : 'neutral',
      emphasis: kpis.failedTransactions > 0,
    },
    {
      label: 'Pending',
      value: kpis.pendingTransactions.toString(),
      subtext: 'Awaiting completion',
    },
  ]
}
