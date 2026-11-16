import { describe, expect, it } from 'vitest'
import { parseMapboxFeature } from '../mapbox-geocoding-provider'

describe('parseMapboxFeature (#1336)', () => {
  it('reads a city result: the city is the feature itself, not in its context', () => {
    const parsed = parseMapboxFeature({
      id: 'place.123',
      place_name: 'Grand Rapids, Michigan, United States',
      text: 'Grand Rapids',
      center: [-85.67, 42.96],
      context: [
        { id: 'region.1', text: 'Michigan', short_code: 'US-MI' },
        { id: 'country.1', text: 'United States', short_code: 'us' },
      ],
    })
    expect(parsed).toMatchObject({
      locality: 'Grand Rapids',
      stateAbbreviation: 'MI',
      administrativeAreaLevel1: 'Michigan',
      country: 'United States',
      streetAddress: '',
      route: '',
    })
  })

  it('reads a street address from the feature and the city from its context', () => {
    const parsed = parseMapboxFeature({
      id: 'address.9',
      place_name: '100 Monroe Center St NW, Grand Rapids, Michigan 49503, United States',
      text: 'Monroe Center St NW',
      address: '100',
      center: [-85.67, 42.96],
      context: [
        { id: 'postcode.1', text: '49503' },
        { id: 'place.123', text: 'Grand Rapids' },
        { id: 'region.1', text: 'Michigan', short_code: 'US-MI' },
        { id: 'country.1', text: 'United States', short_code: 'us' },
      ],
    })
    expect(parsed).toMatchObject({
      streetAddress: '100 Monroe Center St NW',
      locality: 'Grand Rapids',
      postalCode: '49503',
      stateAbbreviation: 'MI',
    })
  })

  it('reads a state result from its own short code', () => {
    const parsed = parseMapboxFeature({
      id: 'region.1',
      place_name: 'Michigan, United States',
      text: 'Michigan',
      properties: { short_code: 'US-MI' },
      center: [-85, 44],
      context: [{ id: 'country.1', text: 'United States', short_code: 'us' }],
    })
    expect(parsed).toMatchObject({ locality: '', stateAbbreviation: 'MI', administrativeAreaLevel1: 'Michigan' })
  })
})
