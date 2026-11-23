import { describe, expect, it } from 'vitest'
import { getStatusDescription, getStatusMetadata } from '../status.utils'

const STATUSES = [
  'pending',
  'invited',
  'submitted',
  'in_progress',
  'under_review',
  'completed_clear',
  'completed_consider',
  'completed_not_clear',
  'partially_completed',
  'failed',
  'cancelled',
  'disputed',
  'expired',
  'refunded',
] as const

describe('getStatusDescription (#1379)', () => {
  it('keeps the worker-facing description by default', () => {
    expect(getStatusDescription('pending')).toBe(getStatusMetadata('pending').description)
  })

  it('describes every status for a reviewer, never in the second person', () => {
    for (const status of STATUSES) {
      const text = getStatusDescription(status, 'reviewer')
      expect(text, status).not.toBe('')
      expect(text, status).not.toMatch(/\byou(r)?\b/i)
    }
  })
})
