import { describe, expect, it, vi } from 'vitest'
import { type ClaimDeps, claimPendingInvite } from '../claimPendingInvite'
import { InviteRequestError } from '../invitesApi'

function deps(overrides: Partial<ClaimDeps> & { pending?: { code: string; landedAt: string } | null; checked?: boolean } = {}) {
  const { pending = null, checked = false, ...rest } = overrides
  return {
    readPending: vi.fn(async () => pending),
    clearPending: vi.fn(async () => {}),
    wasChecked: vi.fn(async () => checked),
    markChecked: vi.fn(async () => {}),
    storeInvitedBy: vi.fn(async () => {}),
    claim: vi.fn(async () => ({ claimed: true as const, referrer: { firstName: 'Clay' } })),
    ...rest,
  }
}

const user = { id: 'u1', token: 'jwt' }
const pending = { code: 'abc234xyz789', landedAt: '2026-11-24T00:00:00.000Z' }

describe('claimPendingInvite', () => {
  it('claims a stored code, clears it, and remembers who invited', async () => {
    const d = deps({ pending })
    expect(await claimPendingInvite(user, d)).toEqual({ action: 'claimed', firstName: 'Clay', via: 'code' })
    expect(d.claim).toHaveBeenCalledWith('jwt', pending)
    expect(d.clearPending).toHaveBeenCalled()
    expect(d.markChecked).toHaveBeenCalledWith('u1')
    expect(d.storeInvitedBy).toHaveBeenCalledWith('Clay')
  })

  it('with no code, asks once by email; afterwards skips without a request', async () => {
    const first = deps({ claim: vi.fn(async () => ({ claimed: false as const, reason: 'no_invite' })) })
    expect(await claimPendingInvite(user, first)).toEqual({ action: 'not_claimed', reason: 'no_invite', via: 'email' })
    expect(first.claim).toHaveBeenCalledWith('jwt', {})
    expect(first.markChecked).toHaveBeenCalledWith('u1')

    const later = deps({ checked: true })
    expect(await claimPendingInvite(user, later)).toEqual({ action: 'skipped' })
    expect(later.claim).not.toHaveBeenCalled()
  })

  it('a stored code is claimed even when this user was already checked', async () => {
    const d = deps({ pending, checked: true })
    expect((await claimPendingInvite(user, d)).action).toBe('claimed')
  })

  it('any answer clears the code: already attributed, not new, invalid', async () => {
    for (const reason of ['already_attributed', 'not_new', 'invalid_code', 'self']) {
      const d = deps({ pending, claim: vi.fn(async () => ({ claimed: false as const, reason })) })
      expect(await claimPendingInvite(user, d)).toEqual({ action: 'not_claimed', reason, via: 'code' })
      expect(d.clearPending).toHaveBeenCalled()
      expect(d.storeInvitedBy).not.toHaveBeenCalled()
    }
  })

  it('a network error or 5xx keeps the code and the check for next time', async () => {
    const d = deps({
      pending,
      claim: vi.fn(async () => {
        throw new InviteRequestError('claim failed (503)', true)
      }),
    })
    expect((await claimPendingInvite(user, d)).action).toBe('retry_later')
    expect(d.clearPending).not.toHaveBeenCalled()
    expect(d.markChecked).not.toHaveBeenCalled()
  })

  it('a 4xx it does not understand is final', async () => {
    const d = deps({
      pending,
      claim: vi.fn(async () => {
        throw new InviteRequestError('claim failed (400)', false)
      }),
    })
    expect((await claimPendingInvite(user, d)).action).toBe('not_claimed')
    expect(d.clearPending).toHaveBeenCalled()
  })
})
