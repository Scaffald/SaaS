import { describe, expect, it } from 'vitest'

import {
  appendStatusHistory,
  mapProviderStatus,
  mergeMetadata,
  shouldSyncStatus,
} from '../background-check-status';

describe('background-check-status helpers', () => {
  describe('mapProviderStatus', () => {
    it('maps known provider statuses to internal equivalents', () => {
      expect(mapProviderStatus('processing')).toBe('in_progress')
      expect(mapProviderStatus('complete_not_clear')).toBe('completed_not_clear')
      expect(mapProviderStatus('partial')).toBe('partially_completed')
    })

    it('normalises loosely formatted provider statuses', () => {
      expect(mapProviderStatus('COMPLETE-clear')).toBe('completed_clear')
      expect(mapProviderStatus('Completed')).toBe('completed_clear')
      expect(mapProviderStatus('In-Progress')).toBe('in_progress')
    })

    it('returns null for unknown statuses', () => {
      expect(mapProviderStatus(null)).toBeNull()
      expect(mapProviderStatus(undefined)).toBeNull()
      expect(mapProviderStatus('awaiting_manual_review')).toBeNull()
    })
  })

  describe('shouldSyncStatus', () => {
    it('skips syncing terminal statuses', () => {
      expect(shouldSyncStatus('completed_clear')).toBe(false)
      expect(shouldSyncStatus('disputed')).toBe(false)
      expect(shouldSyncStatus('refunded')).toBe(false)
    })

    it('syncs active lifecycle statuses', () => {
      expect(shouldSyncStatus('pending')).toBe(true)
      expect(shouldSyncStatus('in_progress')).toBe(true)
      expect(shouldSyncStatus('under_review')).toBe(true)
    })
  })

  describe('appendStatusHistory', () => {
    it('appends new history entries while preserving prior records', () => {
      const existing = [{ status: 'pending' }]
      const appended = appendStatusHistory(existing, { status: 'submitted' })

      expect(appended).toHaveLength(2)
      expect(appended[0]).toEqual(existing[0])
      expect(appended[1]).toEqual({ status: 'submitted' })
      expect(existing).toHaveLength(1)
    })

    it('creates a new history array when none exists', () => {
      const appended = appendStatusHistory(undefined, { status: 'pending' })
      expect(appended).toEqual([{ status: 'pending' }])
    })
  })

  describe('mergeMetadata', () => {
    it('merges metadata objects shallowly', () => {
      const merged = mergeMetadata(
        { nationsearch: { status: 'pending' }, notes: 'original' },
        { notes: 'updated', actor: 'worker' },
      )

      expect(merged).toEqual({
        nationsearch: { status: 'pending' },
        notes: 'updated',
        actor: 'worker',
      })
    })

    it('treats non-object metadata as empty when merging', () => {
      const merged = mergeMetadata(null, { actor: 'system' })
      expect(merged).toEqual({ actor: 'system' })
    })
  })
})


