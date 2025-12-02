import { describe, expect, it } from 'vitest'

import {
  TEAM_ROLE_KEYS,
  teamCreateSchema,
  teamInvitationCreateSchema,
  teamInvitationRespondSchema,
  teamMemberAddSchema,
  teamMemberUpdateSchema,
  teamUpdateSchema,
} from '../teams.ts'

const baseTeamInput = () => ({
  organizationId: '11111111-2222-3333-4444-555555555555',
  name: 'Field Operations',
})

describe('teamCreateSchema', () => {
  it('accepts minimal valid input and applies defaults', () => {
    const parsed = teamCreateSchema.parse(baseTeamInput())

    expect(parsed.visibility).toBe('organization')
    expect(parsed.metadata).toEqual({})
    expect(parsed.defaultRoleKey).toBe('member')
    expect(parsed.invitationPolicy).toBe('invite_only')
  })

  it('rejects invalid slug pattern', () => {
    expect(() =>
      teamCreateSchema.parse({
        ...baseTeamInput(),
        slug: 'invalid slug',
      }),
    ).toThrowError(/Slug may only contain letters, numbers, and hyphens/)
  })

})

describe('teamUpdateSchema', () => {
  it('requires at least one change', () => {
    expect(() =>
      teamUpdateSchema.parse({
        teamId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      }),
    ).toThrowError(/At least one field must be provided/)
  })

  it('allows updating name and visibility', () => {
    expect(() =>
      teamUpdateSchema.parse({
        teamId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'Updated Team Name',
        visibility: 'private',
      }),
    ).not.toThrow()
  })

  it('allows updating team metadata fields', () => {
    expect(() =>
      teamUpdateSchema.parse({
        teamId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        description: { summary: 'Updated summary' },
        settings: { notifications: { email: true } },
      }),
    ).not.toThrow()
  })
})

describe('teamMemberAddSchema', () => {
  it('defaults to team configured role when none is provided', () => {
    expect(() =>
      teamMemberAddSchema.parse({
        teamId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        userId: '99999999-8888-7777-6666-555555555555',
      }),
    ).not.toThrow()
  })

  it('accepts role key assignments', () => {
    expect(() =>
      teamMemberAddSchema.parse({
        teamId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        userId: '99999999-8888-7777-6666-555555555555',
        roleKey: TEAM_ROLE_KEYS[0],
      }),
    ).not.toThrow()
  })
})

describe('teamMemberUpdateSchema', () => {
  it('requires a role or status change', () => {
    expect(() =>
      teamMemberUpdateSchema.parse({
        teamMemberId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      }),
    ).toThrowError(/Provide at least one change when modifying a team member/)
  })

  it('accepts status changes', () => {
    expect(() =>
      teamMemberUpdateSchema.parse({
        teamMemberId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        status: 'pending',
      }),
    ).not.toThrow()
  })
})

describe('teamInvitationCreateSchema', () => {
  it('requires an invitation role', () => {
    expect(() =>
      teamInvitationCreateSchema.parse({
        teamId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        email: 'new.member@example.com',
      }),
    ).toThrowError(/role must be provided/)
  })

  it('accepts role key invitations', () => {
    expect(() =>
      teamInvitationCreateSchema.parse({
        teamId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        organizationId: '11111111-2222-3333-4444-555555555555',
        email: 'new.member@example.com',
        roleKey: 'member',
      }),
    ).not.toThrow()
  })

  it('requires an email or user id', () => {
    expect(() =>
      teamInvitationCreateSchema.parse({
        teamId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        organizationId: '11111111-2222-3333-4444-555555555555',
        roleKey: 'member',
      }),
    ).toThrowError(/Provide an email or user ID/)
  })
})

describe('teamInvitationRespondSchema', () => {
  it('validates token length and action enum', () => {
    expect(() =>
      teamInvitationRespondSchema.parse({
        token: 'short',
        action: 'accept',
      }),
    ).toThrowError(/appears to be invalid/)

    expect(() =>
      teamInvitationRespondSchema.parse({
        token: 'tok_tok_tok_tok_tok_tok_tok_tok',
        action: 'maybe',
      }),
    ).toThrowError(/Invalid enum value/)
  })
})

