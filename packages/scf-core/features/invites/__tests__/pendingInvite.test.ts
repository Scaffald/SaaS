import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = vi.hoisted(() => new Map<string, string>())
vi.mock('../../../utils/platform', () => ({
  kvStorage: {
    get: async (k: string) => store.get(k) ?? null,
    set: async (k: string, v: string) => void store.set(k, v),
    remove: async (k: string) => void store.delete(k),
  },
}))

import {
  clearPendingInvite,
  markInviteChecked,
  normalizeInviteCode,
  PENDING_INVITE_TTL_MS,
  readInvitedBy,
  readPendingInvite,
  storeInvitedBy,
  storePendingInvite,
  wasInviteChecked,
} from '../pendingInvite'

beforeEach(() => store.clear())

describe('pendingInvite', () => {
  it('normalises codes and refuses junk', () => {
    expect(normalizeInviteCode(' AbC234xyz ')).toBe('abc234xyz')
    expect(normalizeInviteCode('ab')).toBeNull()
    expect(normalizeInviteCode('../etc/passwd')).toBeNull()
    expect(normalizeInviteCode(undefined)).toBeNull()
  })

  it('stores, reads and clears a code', async () => {
    const now = new Date('2026-11-24T00:00:00Z')
    expect(await storePendingInvite('ABC234xyz789', now)).toBe(true)
    expect(await readPendingInvite(now)).toEqual({ code: 'abc234xyz789', landedAt: now.toISOString() })
    await clearPendingInvite()
    expect(await readPendingInvite(now)).toBeNull()
    expect(await storePendingInvite('no!')).toBe(false)
  })

  it('drops an expired or corrupt entry', async () => {
    const then = new Date('2026-10-01T00:00:00Z')
    await storePendingInvite('abc234xyz789', then)
    expect(await readPendingInvite(new Date(then.getTime() + PENDING_INVITE_TTL_MS + 1))).toBeNull()
    expect(store.size).toBe(0)
    store.set('scaffald.pending-invite', '{not json')
    expect(await readPendingInvite()).toBeNull()
  })

  it('keys avoid the substrings sign-out cleanup deletes', async () => {
    await storePendingInvite('abc234xyz789')
    await storeInvitedBy('Clay')
    await markInviteChecked('user-1')
    for (const key of store.keys()) {
      expect(key).not.toMatch(/auth|session|supabase|sb-/)
    }
  })

  it('remembers the inviter and per-user checks', async () => {
    expect(await readInvitedBy()).toBeNull()
    await storeInvitedBy('Clay')
    expect(await readInvitedBy()).toBe('Clay')
    expect(await wasInviteChecked('u1')).toBe(false)
    await markInviteChecked('u1')
    expect(await wasInviteChecked('u1')).toBe(true)
    expect(await wasInviteChecked('u2')).toBe(false)
  })
})
