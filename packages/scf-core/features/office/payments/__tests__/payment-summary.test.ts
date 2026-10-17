import { describe, expect, it } from 'vitest'
import { paymentSummaryCards } from '../payment-summary'

const kpis = (overrides: Partial<Parameters<typeof paymentSummaryCards>[0]> = {}) => ({
  totalRevenue: 0,
  totalTransactions: 0,
  succeededTransactions: 0,
  failedTransactions: 0,
  pendingTransactions: 0,
  successRate: 0,
  ...overrides,
})

const card = (cards: ReturnType<typeof paymentSummaryCards>, label: string) => {
  const found = cards.find((c) => c.label === label)
  if (!found) throw new Error(`no ${label} card`)
  return found
}

describe('paymentSummaryCards (#1174)', () => {
  it('states no rate and no success over zero transactions', () => {
    const cards = paymentSummaryCards(kpis())
    expect(card(cards, 'Success Rate').value).toBe('—')
    expect(card(cards, 'Success Rate').subtext).toBe('No transactions yet')
    expect(card(cards, 'Failed Transactions').subtext).toBe('No transactions yet')
    for (const c of cards) {
      expect(c.subtext).not.toMatch(/succeeded/)
      expect(c.value).not.toMatch(/%/)
    }
  })

  it('reports the real rate once there are transactions', () => {
    const cards = paymentSummaryCards(
      kpis({ totalTransactions: 4, succeededTransactions: 3, failedTransactions: 1, successRate: 75 })
    )
    expect(card(cards, 'Success Rate').value).toBe('75.0%')
    expect(card(cards, 'Success Rate').subtext).toBe('3 of 4 succeeded')
    expect(card(cards, 'Failed Transactions').tone).toBe('attention')
    expect(card(cards, 'Failed Transactions').emphasis).toBe(true)
  })

  it('does not claim everything succeeded while some are still pending', () => {
    const cards = paymentSummaryCards(
      kpis({ totalTransactions: 3, succeededTransactions: 2, pendingTransactions: 1, successRate: 66.7 })
    )
    const failed = card(cards, 'Failed Transactions')
    expect(failed.subtext).toBe('None failed')
    expect(failed.tone).toBe('neutral')
    expect(failed.emphasis).toBe(false)
  })
})
