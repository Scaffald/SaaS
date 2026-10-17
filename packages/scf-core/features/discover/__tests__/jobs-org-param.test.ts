import { describe, expect, it } from 'vitest'
import { readOrgParam } from '../jobs-org-param'

const ORG = '3f2b8c1e-6d4a-4f7e-9b2c-1a5d8e7f6c3b'

describe('readOrgParam (#1282)', () => {
  it('reads the employer id the map preview links with', () => {
    expect(readOrgParam(ORG)).toBe(ORG)
    expect(readOrgParam(` ${ORG} `)).toBe(ORG)
  })

  it('takes the first of a repeated param', () => {
    expect(readOrgParam([ORG, 'other'])).toBe(ORG)
  })

  it('scopes nothing when the param is absent, empty or not an id', () => {
    expect(readOrgParam(undefined)).toBeUndefined()
    expect(readOrgParam('')).toBeUndefined()
    expect(readOrgParam([])).toBeUndefined()
    expect(readOrgParam('acme-builders')).toBeUndefined()
  })
})
