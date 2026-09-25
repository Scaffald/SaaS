import { describe, expect, it } from 'vitest'
import {
  profileEmploymentBaseSchema,
  profileEmploymentInputSchema,
} from '@scf/supabase/client-types'

/**
 * #910. The five employment cards each `.pick()` a single field out of the
 * employment schema inside their save handler. zod 4.6 refuses `.pick()` on an
 * object carrying a refinement:
 *
 *   Error: .pick() cannot be used on object schemas containing refinements
 *
 * zod 4.1 allowed it and quietly dropped the refinement, so the cards picked
 * from the refined schema for as long as the pin held. On 4.6 the `.pick()`
 * throws before `safeParse` is reached — inside an event handler, so the
 * user's selection is simply never saved and nothing says why.
 *
 * These tests fail the moment someone attaches a refinement to the schema the
 * cards import, which is the only way to notice before a browser does.
 */
describe('employment schema: what the cards pick from', () => {
  const PICKED_FIELDS = [
    'drivers_license_classes',
    'military_status',
    'availability',
    'preferred_work_locations',
    'hourly_rate',
  ] as const

  it.each(PICKED_FIELDS)('%s can be picked without throwing', (field) => {
    expect(() =>
      profileEmploymentBaseSchema.pick({ [field]: true } as never)
    ).not.toThrow()
  })

  it('a picked array field round-trips the value the card passes in', () => {
    const result = profileEmploymentBaseSchema
      .pick({ drivers_license_classes: true })
      .safeParse({ drivers_license_classes: ['Class A'] })

    expect(result.success).toBe(true)
    expect(result.success && result.data.drivers_license_classes).toEqual(['Class A'])
  })

  it('a picked field still enforces its own rules', () => {
    const result = profileEmploymentBaseSchema
      .pick({ preferred_work_locations: true })
      .safeParse({ preferred_work_locations: ['a', 'b', 'c', 'd'] })

    expect(result.success).toBe(false)
  })
})

describe('employment schema: the refined one routers validate against', () => {
  it('still rejects open_to_travel with no distance', () => {
    const result = profileEmploymentInputSchema.safeParse({ open_to_travel: true })

    expect(result.success).toBe(false)
    expect(result.success === false && result.error.issues[0]?.message).toBe(
      'Please select a travel distance'
    )
  })

  it('accepts the same payload once a distance is given', () => {
    expect(
      profileEmploymentInputSchema.safeParse({
        open_to_travel: true,
        travel_distance_miles: 25,
      }).success
    ).toBe(true)
  })
})
