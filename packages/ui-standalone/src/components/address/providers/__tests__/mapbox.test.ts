import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProviderConfig } from '../../types'
import { GeocodingError } from '../../types'
import { MapboxProvider } from '../mapbox'

// Mock fetch globally
global.fetch = vi.fn() as typeof fetch

describe('MapboxProvider', () => {
  const mockConfig: ProviderConfig = {
    provider: 'mapbox',
    apiKey: 'pk.test-key-123',
    defaultCountry: 'US',
    language: 'en',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('throws error when API key is missing', () => {
      expect(() => {
        new MapboxProvider({ provider: 'mapbox', apiKey: '' })
      }).toThrow(GeocodingError)
    })

    it('creates instance with valid config', () => {
      const provider = new MapboxProvider(mockConfig)
      expect(provider).toBeInstanceOf(MapboxProvider)
    })
  })

  describe('search', () => {
    it('returns empty array for empty query', async () => {
      const provider = new MapboxProvider(mockConfig)
      const results = await provider.search('')
      expect(results).toEqual([])
    })

    it('returns empty array for whitespace-only query', async () => {
      const provider = new MapboxProvider(mockConfig)
      const results = await provider.search('   ')
      expect(results).toEqual([])
    })

    it('returns results for valid city query', async () => {
      const mockResponse = {
        type: 'FeatureCollection',
        features: [
          {
            id: 'place.123',
            type: 'Feature',
            place_type: ['place'],
            relevance: 0.9,
            properties: {},
            text: 'Boston',
            place_name: 'Boston, Massachusetts, United States',
            center: [-71.0589, 42.3601],
            geometry: {
              type: 'Point',
              coordinates: [-71.0589, 42.3601],
            },
            context: [
              {
                id: 'region.123',
                mapbox_id: 'region-123',
                text: 'Massachusetts',
                short_code: 'US-MA',
              },
              {
                id: 'country.123',
                mapbox_id: 'country-123',
                text: 'United States',
                short_code: 'us',
              },
            ],
          },
        ],
        attribution: 'Mapbox',
      }

      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      const results = await provider.search('Boston')

      expect(results).toHaveLength(1)
      expect(results[0].formattedAddress).toContain('Boston')
      expect(results[0].coordinates.lat).toBe(42.3601)
      expect(results[0].coordinates.lng).toBe(-71.0589)
      // Locality is extracted from context - in this case from the feature text since it's a place type
      // The route will be "Boston" for place types
      expect(results[0].route).toBe('Boston')
      expect(results[0].administrativeAreaLevel1).toBe('Massachusetts')
      expect(results[0].stateAbbreviation).toBe('MA')
    })

    it('respects maxResults limit', async () => {
      const mockResponse = {
        type: 'FeatureCollection',
        features: Array.from({ length: 10 }, (_, i) => ({
          id: `place.${i}`,
          type: 'Feature',
          place_type: ['place'],
          relevance: 0.9 - i * 0.1,
          properties: {},
          text: `City ${i}`,
          place_name: `City ${i}, State`,
          center: [-71.0589, 42.3601],
          geometry: {
            type: 'Point',
            coordinates: [-71.0589, 42.3601],
          },
          context: [],
        })),
        attribution: 'Mapbox',
      }

      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      const results = await provider.search('City', { limit: 5 })

      // Note: The provider filters by zoom level, so results may be less than requested
      expect(results.length).toBeGreaterThan(0)
      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      expect(fetchCall[0]).toContain('limit=5')
    })

    it('filters results by zoom level', async () => {
      const mockResponse = {
        type: 'FeatureCollection',
        features: [
          {
            id: 'place.123',
            type: 'Feature',
            place_type: ['place'],
            relevance: 0.9,
            properties: {},
            text: 'Boston',
            place_name: 'Boston, Massachusetts',
            center: [-71.0589, 42.3601],
            geometry: {
              type: 'Point',
              coordinates: [-71.0589, 42.3601],
            },
            context: [],
          },
          {
            id: 'address.123',
            type: 'Feature',
            place_type: ['address'],
            relevance: 0.8,
            properties: {},
            text: '123 Main St',
            place_name: '123 Main St, Boston, MA',
            center: [-71.0589, 42.3601],
            geometry: {
              type: 'Point',
              coordinates: [-71.0589, 42.3601],
            },
            context: [],
          },
        ],
        attribution: 'Mapbox',
      }

      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      const results = await provider.search('Boston', { zoomLevel: 'city' })

      // Should filter to only city-level results (place type)
      expect(results.length).toBeGreaterThan(0)
      expect(results.every((r) => r.types.includes('locality'))).toBe(true)
    })

    it('filters results by type', async () => {
      const mockResponse = {
        type: 'FeatureCollection',
        features: [
          {
            id: 'place.123',
            type: 'Feature',
            place_type: ['place'],
            relevance: 0.9,
            properties: {},
            text: 'Boston',
            place_name: 'Boston, Massachusetts',
            center: [-71.0589, 42.3601],
            geometry: {
              type: 'Point',
              coordinates: [-71.0589, 42.3601],
            },
            context: [],
          },
        ],
        attribution: 'Mapbox',
      }

      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      const results = await provider.search('Boston', {
        types: ['locality', 'place'],
      })

      expect(results.length).toBeGreaterThan(0)
      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      expect(fetchCall[0]).toContain('types=place')
    })

    it('handles 401 unauthorized error', async () => {
      // Create a Response-like object with all necessary properties
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        json: async () => ({}),
        text: async () => '',
        clone: () => mockResponse,
      } as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

      const provider = new MapboxProvider(mockConfig)

      await expect(provider.search('Boston')).rejects.toThrow(
        /Invalid API key|Invalid access token/
      )
    })

    it('handles 429 rate limit error', async () => {
      // Create a Response-like object with all necessary properties
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers(),
        json: async () => ({}),
        text: async () => '',
        clone: () => mockResponse,
      } as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

      const provider = new MapboxProvider(mockConfig)

      await expect(provider.search('Boston')).rejects.toThrow(/Rate limit|rate limit/i)
    })

    it('handles network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))

      const provider = new MapboxProvider(mockConfig)

      await expect(provider.search('Boston')).rejects.toThrow(GeocodingError)
    })

    it('returns empty array when response has no features', async () => {
      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          type: 'FeatureCollection',
          features: [],
          attribution: 'Mapbox',
        }),
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      const results = await provider.search('NonexistentCity12345')

      expect(results).toEqual([])
    })
  })

  describe('geocode', () => {
    it('returns null for empty address', async () => {
      const provider = new MapboxProvider(mockConfig)
      const result = await provider.geocode('')
      expect(result).toBeNull()
    })

    it('returns null for whitespace-only address', async () => {
      const provider = new MapboxProvider(mockConfig)
      const result = await provider.geocode('   ')
      expect(result).toBeNull()
    })

    it('returns single result for valid address', async () => {
      const mockResponse = {
        type: 'FeatureCollection',
        features: [
          {
            id: 'place.123',
            type: 'Feature',
            place_type: ['place'],
            relevance: 0.9,
            properties: {},
            text: 'Boston',
            place_name: 'Boston, Massachusetts, United States',
            center: [-71.0589, 42.3601],
            geometry: {
              type: 'Point',
              coordinates: [-71.0589, 42.3601],
            },
            context: [
              {
                id: 'region.123',
                mapbox_id: 'region-123',
                text: 'Massachusetts',
                short_code: 'US-MA',
              },
            ],
          },
        ],
        attribution: 'Mapbox',
      }

      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      const result = await provider.geocode('Boston, MA')

      expect(result).not.toBeNull()
      expect(result?.formattedAddress).toContain('Boston')
      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      expect(fetchCall[0]).toContain('limit=1')
    })

    it('returns null when no results found', async () => {
      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          type: 'FeatureCollection',
          features: [],
          attribution: 'Mapbox',
        }),
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      const result = await provider.geocode('NonexistentAddress12345')

      expect(result).toBeNull()
    })
  })

  describe('reverseGeocode', () => {
    it('throws error for invalid coordinates', async () => {
      const provider = new MapboxProvider(mockConfig)

      await expect(provider.reverseGeocode(91, 0)).rejects.toThrow(GeocodingError)
      await expect(provider.reverseGeocode(0, 181)).rejects.toThrow(GeocodingError)
      await expect(provider.reverseGeocode(NaN, 0)).rejects.toThrow(GeocodingError)
    })

    it('returns address for valid coordinates', async () => {
      const mockResponse = {
        type: 'FeatureCollection',
        features: [
          {
            id: 'address.123',
            type: 'Feature',
            place_type: ['address'],
            relevance: 0.9,
            properties: {
              address: '123',
            },
            text: 'Main Street',
            place_name: '123 Main Street, Boston, MA 02101',
            center: [-71.0589, 42.3601],
            geometry: {
              type: 'Point',
              coordinates: [-71.0589, 42.3601],
            },
            context: [
              {
                id: 'place.123',
                mapbox_id: 'place-123',
                text: 'Boston',
              },
              {
                id: 'region.123',
                mapbox_id: 'region-123',
                text: 'Massachusetts',
                short_code: 'US-MA',
              },
            ],
          },
        ],
        attribution: 'Mapbox',
      }

      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      const result = await provider.reverseGeocode(42.3601, -71.0589)

      expect(result).not.toBeNull()
      expect(result?.formattedAddress).toBeTruthy()
      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      expect(fetchCall[0]).toContain('-71.0589,42.3601')
    })

    it('returns null when no results found', async () => {
      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          type: 'FeatureCollection',
          features: [],
          attribution: 'Mapbox',
        }),
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      const result = await provider.reverseGeocode(0, 0)

      expect(result).toBeNull()
    })

    it('handles errors during reverse geocoding', async () => {
      // Create a Response-like object with all necessary properties
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        json: async () => ({}),
        text: async () => '',
        clone: () => mockResponse,
      } as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

      const provider = new MapboxProvider(mockConfig)

      await expect(provider.reverseGeocode(42.3601, -71.0589)).rejects.toThrow(GeocodingError)
    })
  })

  describe('URL building', () => {
    it('includes API key in search URL', async () => {
      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          type: 'FeatureCollection',
          features: [],
          attribution: 'Mapbox',
        }),
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      await provider.search('Boston')

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      expect(fetchCall[0]).toContain('access_token=pk.test-key-123')
    })

    it('includes country restriction when provided', async () => {
      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          type: 'FeatureCollection',
          features: [],
          attribution: 'Mapbox',
        }),
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      await provider.search('Boston', { country: 'US' })

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      // Country code is converted to lowercase in the implementation
      expect(fetchCall[0]).toMatch(/country=(us|US)/)
    })

    it('includes bounds when provided', async () => {
      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          type: 'FeatureCollection',
          features: [],
          attribution: 'Mapbox',
        }),
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      await provider.search('Boston', {
        bounds: {
          north: 43,
          south: 42,
          east: -70,
          west: -72,
        },
      })

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      // Bbox is URL encoded, so check for the encoded version or decode
      expect(fetchCall[0]).toContain('bbox')
      expect(decodeURIComponent(fetchCall[0] as string)).toContain('bbox=-72,42,-70,43')
    })

    it('includes proximity bias when provided', async () => {
      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          type: 'FeatureCollection',
          features: [],
          attribution: 'Mapbox',
        }),
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      await provider.search('Boston', {
        proximity: {
          lat: 42.3601,
          lng: -71.0589,
        },
      })

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      // Proximity is URL encoded
      expect(decodeURIComponent(fetchCall[0] as string)).toContain('proximity=-71.0589,42.3601')
    })

    it('includes language when provided', async () => {
      const mockFetchResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          type: 'FeatureCollection',
          features: [],
          attribution: 'Mapbox',
        }),
      } as unknown as Response
      vi.mocked(global.fetch).mockResolvedValueOnce(mockFetchResponse)

      const provider = new MapboxProvider(mockConfig)
      await provider.search('Boston', { language: 'es' })

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      expect(fetchCall[0]).toContain('language=es')
    })
  })
})
