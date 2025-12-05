import { describe, expect, it } from 'vitest'

import {
  canTransitionInquiryStatus,
  getApplicationStatusForInquiry,
  getNextPossibleStatuses,
  isTerminalStatus,
  type InquiryStatus,
} from '../inquiry-state-machine'

describe('inquiry state machine', () => {
  it('allows the happy-path transitions for both parties', () => {
    const orderedStatuses: InquiryStatus[] = [
      'draft',
      'sent',
      'candidate_responded',
      'organization_responded',
      'accepted',
    ]

    orderedStatuses.slice(0, -1).forEach((status, index) => {
      const nextStatus = orderedStatuses[index + 1]
      expect(canTransitionInquiryStatus(status, nextStatus)).toBe(true)
    })
  })

  it('blocks invalid regressions or jumps', () => {
    expect(canTransitionInquiryStatus('draft', 'accepted')).toBe(false)
    expect(canTransitionInquiryStatus('sent', 'draft')).toBe(false)
    expect(canTransitionInquiryStatus('candidate_responded', 'sent')).toBe(false)
    expect(canTransitionInquiryStatus('rejected', 'sent')).toBe(false)
  })

  it('marks only accepted/rejected/withdrawn as terminal', () => {
    const terminalStatuses: InquiryStatus[] = ['accepted', 'rejected', 'withdrawn']
    terminalStatuses.forEach((status) => {
      expect(isTerminalStatus(status)).toBe(true)
    })

    const nonTerminalStatuses: InquiryStatus[] = [
      'draft',
      'sent',
      'candidate_responded',
      'organization_responded',
    ]
    nonTerminalStatuses.forEach((status) => {
      expect(isTerminalStatus(status)).toBe(false)
    })
  })

  it('maps inquiry statuses to the correct application stages', () => {
    expect(getApplicationStatusForInquiry('draft')).toBe('screen')
    expect(getApplicationStatusForInquiry('sent')).toBe('inquired')
    expect(getApplicationStatusForInquiry('candidate_responded')).toBe('inquired')
    expect(getApplicationStatusForInquiry('organization_responded')).toBe('inquired')
    expect(getApplicationStatusForInquiry('accepted')).toBe('offer')
    expect(getApplicationStatusForInquiry('rejected')).toBe('screen')
    expect(getApplicationStatusForInquiry('withdrawn')).toBe('screen')
  })

  it('exposes the list of next valid statuses as a shallow copy', () => {
    const nextStatuses = getNextPossibleStatuses('candidate_responded')
    expect(nextStatuses).toEqual([
      'organization_responded',
      'accepted',
      'rejected',
      'withdrawn',
    ])

    // Mutating the returned array must not impact the internal map.
    nextStatuses.push('withdrawn')
    expect(getNextPossibleStatuses('candidate_responded')).toContain('withdrawn')
  })
})
