import { HttpResponse, http } from 'msw'

import type { ContractInteractionRecorder } from './types'

const mapboxContractResponse = {
  attribution: '© Mapbox',
  features: [
    {
      address: '123',
      center: [-89.6501, 39.7817],
      context: [
        { id: 'place.123', mapbox_id: 'place.123', short_code: 'US-IL', text: 'Springfield' },
        { id: 'region.123', mapbox_id: 'region.123', short_code: 'US-IL', text: 'Illinois' },
        { id: 'country.123', mapbox_id: 'country.123', short_code: 'US', text: 'United States' },
      ],
      geometry: {
        coordinates: [-89.6501, 39.7817],
        type: 'Point',
      },
      id: 'address.1234',
      place_name: '123 Main St, Springfield, Illinois 62704, United States',
      place_type: ['address'],
      properties: {
        accuracy: 'point',
        address: '123',
      },
      relevance: 1,
      text: 'Main St',
      type: 'Feature',
    },
  ],
  query: ['123 Main St'],
  type: 'FeatureCollection',
}

export const createMapboxHandler = (record: ContractInteractionRecorder) =>
  http.get(
    'https://api.mapbox.com/geocoding/v5/mapbox.places/:query.json',
    ({ request, params }) => {
      const url = new URL(request.url)

      const token = url.searchParams.get('access_token')
      expect(token).toBeTruthy()

      record({
        name: 'Mapbox geocoding search',
        provider: 'mapbox',
        request: {
          headers: { authorization: request.headers.get('authorization') },
          method: request.method,
          url: request.url,
        },
        response: {
          body: mapboxContractResponse,
          status: 200,
        },
      })

      return HttpResponse.json(mapboxContractResponse)
    }
  )
