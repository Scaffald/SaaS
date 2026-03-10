/**
 * Mapbox Geocoding Provider
 *
 * Implements GeocodingProvider for use with AddressAutocomplete.
 * Uses Mapbox Geocoding API v5.
 */

import type { AddressResult, AddressSearchOptions, GeocodingProvider } from '@scaffald/ui'

interface MapboxFeature {
  id: string
  place_name: string
  center: [number, number]
  address?: string
  text?: string
  context?: Array<{ id: string; text: string; short_code?: string }>
}

interface MapboxGeocodingResponse {
  type: string
  features: MapboxFeature[]
}

function parseMapboxFeature(feature: MapboxFeature): AddressResult {
  const context = feature.context ?? []
  const place = context.find((c) => c.id.startsWith('place.'))
  const region = context.find((c) => c.id.startsWith('region.'))
  const postcode = context.find((c) => c.id.startsWith('postcode.'))
  const country = context.find((c) => c.id.startsWith('country.'))

  const [lng, lat] = feature.center

  // Mapbox returns region.short_code as "US-MI", "CA-ON", etc. Normalize to state/region code only (e.g. "MI", "ON").
  const rawRegionCode = region?.short_code ?? ''
  const stateAbbreviation = rawRegionCode.includes('-')
    ? rawRegionCode.split('-').slice(-1)[0] ?? rawRegionCode
    : rawRegionCode

  return {
    id: feature.id,
    formattedAddress: feature.place_name,
    streetNumber: feature.address ?? '',
    route: feature.text ?? '',
    streetAddress: [feature.address, feature.text].filter(Boolean).join(' '),
    locality: place?.text ?? '',
    administrativeAreaLevel1: region?.text ?? '',
    stateAbbreviation,
    postalCode: postcode?.text ?? '',
    country: country?.text ?? '',
    countryCode: country?.short_code ?? '',
    coordinates: { lat, lng },
    placeId: feature.id,
  }
}

/**
 * Create a Mapbox geocoding provider for use with AddressAutocomplete.
 *
 * @param apiKey - Mapbox access token (EXPO_PUBLIC_MAPBOX_TOKEN)
 */
export function createMapboxGeocodingProvider(apiKey: string): GeocodingProvider {
  const search = async (
    query: string,
    options?: AddressSearchOptions
  ): Promise<AddressResult[]> => {
    const limit = options?.limit ?? 5
    const encoded = encodeURIComponent(query)
    let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${apiKey}&limit=${limit}`
    if (options?.proximity) {
      const { lng, lat } = options.proximity
      url += `&proximity=${lng},${lat}`
    }
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Mapbox geocoding failed: ${res.status}`)
    }

    const data = (await res.json()) as MapboxGeocodingResponse
    return (data.features ?? []).map(parseMapboxFeature)
  }

  return {
    search,
  }
}
