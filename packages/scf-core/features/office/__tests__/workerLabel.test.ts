import { describe, expect, it } from 'vitest'
import { workerLabel } from '../worker-label'

const base = {
  id: '741d4978-0000-0000-0000-000000000000',
  first_name: null,
  last_name: null,
  avatar_path: null,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
}

/**
 * The CMS workers table showed "-", "-" and a truncated UUID for every user
 * without a profile name (#1116). The label falls back through what a person
 * recognises, and never to the id.
 */
describe('workerLabel', () => {
  it('uses the full name when there is one', () => {
    expect(workerLabel({ ...base, first_name: 'Dana', last_name: 'Reyes', email: 'd@x.test' })).toBe(
      'Dana Reyes'
    )
  })

  it('takes a first name alone', () => {
    expect(workerLabel({ ...base, first_name: 'Dana' })).toBe('Dana')
  })

  it('falls back to display name, then username, then email', () => {
    expect(workerLabel({ ...base, display_name: 'D. Reyes', username: 'dreyes', email: 'd@x.test' })).toBe(
      'D. Reyes'
    )
    expect(workerLabel({ ...base, username: 'dreyes', email: 'd@x.test' })).toBe('dreyes')
    expect(workerLabel({ ...base, email: 'd@x.test' })).toBe('d@x.test')
  })

  it('treats empty names as missing', () => {
    expect(workerLabel({ ...base, first_name: '', last_name: ' ', email: 'd@x.test' })).toBe('d@x.test')
  })

  it('never shows the id', () => {
    expect(workerLabel(base)).toBe('Unnamed worker')
  })
})
