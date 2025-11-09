import { describe, expect, it } from 'vitest'

import {
  generalProfileDefaults,
  generalProfileSchema,
  type GeneralProfileFormData,
} from '../profile/general'

const buildValidProfile = (overrides: Partial<GeneralProfileFormData> = {}): GeneralProfileFormData => ({
  ...generalProfileDefaults,
  first_name: 'Ada',
  last_name: 'Lovelace',
  phone: '+14155552671',
  email: 'ada@example.com',
  address: {
    ...generalProfileDefaults.address,
    street: '123 Computing Way',
    city: 'San Francisco',
    state: 'CA',
    zip: '94107',
  },
  ...overrides,
})

describe('generalProfileSchema', () => {
  it('accepts a complete and well-formed profile', () => {
    expect(() => generalProfileSchema.parse(buildValidProfile())).not.toThrow()
  })

  it('enforces required name fields and email formatting', () => {
    expect(() =>
      generalProfileSchema.parse(
        buildValidProfile({
          first_name: '',
          email: 'invalid-email',
        }),
      ),
    ).toThrowError(/First name is required/)
    expect(() =>
      generalProfileSchema.parse(
        buildValidProfile({
          first_name: '',
          email: 'invalid-email',
        }),
      ),
    ).toThrowError(/Please enter a valid email address/)
  })

  it('only accepts valid phone numbers when one is provided', () => {
    expect(() =>
      generalProfileSchema.parse(
        buildValidProfile({
          phone: '123-not-a-number',
        }),
      ),
    ).toThrowError(/Please enter a valid phone number/)
  })
})

