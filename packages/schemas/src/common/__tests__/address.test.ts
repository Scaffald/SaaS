import { describe, expect, it } from 'vitest'

import { addressSchema } from '../address'

describe('addressSchema', () => {
  it('allows undefined values', () => {
    expect(addressSchema.parse(undefined)).toBeUndefined()
  })

  it('allows null values', () => {
    expect(addressSchema.parse(null)).toBeNull()
  })

  it('accepts partial address objects', () => {
    const result = addressSchema.parse({
      city: 'San Francisco',
      country: 'US',
      latitude: 37.7749,
    })

    expect(result).toMatchObject({
      city: 'San Francisco',
      country: 'US',
      latitude: 37.7749,
    })
  })
})
