/**
 * Mapbox Geocoding Provider
 *
 * Implements GeocodingProvider for use with AddressAutocomplete.
 * Uses Mapbox Geocoding API v5.
 */

import type { AddressResult, AddressSearchOptions, GeocodingProvider } from '@scaffald/ui'
import { useMemo } from 'react'

interface MapboxFeature {
  id: string
  place_name: string
  center: [number, number]
  address?: string
  text?: string
  properties?: { short_code?: string }
  context?: Array<{ id: string; text: string; short_code?: string }>
}

interface MapboxGeocodingResponse {
  type: string
  features: MapboxFeature[]
}

export function parseMapboxFeature(feature: MapboxFeature): AddressResult {
  // A feature is itself one level of the address (an address, a place, a
  // region…) and its `context` holds only the levels above it. So a city
  // result has no `place.` entry in its context: its name is the feature's own
  // text. Reading only the context left city searches with an empty city, and
  // treated the city's name as a street (#1336).
  const kind = feature.id.split('.')[0]
  const own = { id: feature.id, text: feature.text ?? '', short_code: feature.properties?.short_code }
  const level = (prefix: string) =>
    kind === prefix ? own : (feature.context ?? []).find((c) => c.id.startsWith(`${prefix}.`))

  const place = level('place')
  const region = level('region')
  const postcode = level('postcode')
  const country = level('country')
  const isAddress = kind === 'address'

  const [lng, lat] = feature.center

  // Mapbox returns region.short_code as "US-MI", "CA-ON", etc. Normalize to state/region code only (e.g. "MI", "ON").
  const rawRegionCode = region?.short_code ?? ''
  const stateAbbreviation = rawRegionCode.includes('-')
    ? rawRegionCode.split('-').slice(-1)[0] ?? rawRegionCode
    : rawRegionCode

  return {
    id: feature.id,
    formattedAddress: feature.place_name,
    streetNumber: isAddress ? (feature.address ?? '') : '',
    route: isAddress ? (feature.text ?? '') : '',
    streetAddress: isAddress ? [feature.address, feature.text].filter(Boolean).join(' ') : '',
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

/**
 * The Mapbox provider for an address field, or null without a token, in which
 * case AddressForm / AddressAutocomplete fall back to manual entry. Passing a
 * bare `provider={null}` instead left fields that never suggested anything
 * (#1336).
 */
export function useMapboxGeocodingProvider(
  token: string | undefined = process.env.EXPO_PUBLIC_MAPBOX_TOKEN
): GeocodingProvider | null {
  return useMemo(() => (token ? createMapboxGeocodingProvider(token) : null), [token])
}
