import { describe, expect, it } from 'vitest'
import { canManageOrgDevelopers } from '../access'

describe('who may manage an organization’s keys and webhooks (#1440)', () => {
  it('its owner and its admin, team or no team', () => {
    expect(canManageOrgDevelopers('owner', [])).toBe(true)
    expect(canManageOrgDevelopers('admin', [])).toBe(true)
  })

  it('a team_admin on any of its teams, even if a plain member elsewhere in it', () => {
    expect(canManageOrgDevelopers('member', ['member', 'team_admin'])).toBe(true)
  })

  it('not a plain member, and not someone with no membership', () => {
    expect(canManageOrgDevelopers('member', ['member'])).toBe(false)
    expect(canManageOrgDevelopers('member', [])).toBe(false)
    expect(canManageOrgDevelopers(null, [])).toBe(false)
    expect(canManageOrgDevelopers(undefined, [null])).toBe(false)
  })
})
