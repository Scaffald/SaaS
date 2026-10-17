import { describe, expect, it } from 'vitest'
import type { CommunityMember } from '@scaffald/sdk/resources/communities'
import { giftRecipients } from '../gift-recipients'

const member = (id: string, display_name: string, headline: string | null = null): CommunityMember => ({
  id,
  display_name,
  avatar_url: null,
  headline,
  is_verified: false,
  joined_at: '2026-01-01T00:00:00Z',
})

const members = [
  member('viewer', 'Zach Servideo', 'Electrician'),
  member('a', 'Ana Ruiz', 'Plumber'),
  member('b', 'Ben Cole', 'Master electrician'),
]

describe('giftRecipients', () => {
  it('never offers the viewer', () => {
    expect(giftRecipients(members, 'viewer', '').map((m) => m.id)).toEqual(['a', 'b'])
  })

  it('keeps the viewer out of search results too', () => {
    expect(giftRecipients(members, 'viewer', 'electric').map((m) => m.id)).toEqual(['b'])
  })

  it('searches name and headline case-insensitively', () => {
    expect(giftRecipients(members, 'viewer', '  ANA ').map((m) => m.id)).toEqual(['a'])
  })

  it('lists everyone while the session user is unknown', () => {
    expect(giftRecipients(members, undefined, '')).toHaveLength(3)
  })

  it('caps the list', () => {
    const many = Array.from({ length: 30 }, (_, i) => member(`m${i}`, `Member ${i}`))
    expect(giftRecipients(many, 'viewer', '')).toHaveLength(20)
  })
})
