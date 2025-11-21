import { http, HttpResponse } from 'msw'

import type { ContractInteractionRecorder } from './types'

const mapboxContractResponse = {
  type: 'FeatureCollection',
  query: ['123 Main St'],
  features: [
    {
      id: 'address.1234',
      type: 'Feature',
      place_type: ['address'],
      relevance: 1,
      properties: {
        accuracy: 'point',
        address: '123',
      },
      text: 'Main St',
      place_name: '123 Main St, Springfield, Illinois 62704, United States',
      center: [-89.6501, 39.7817],
      geometry: {
        type: 'Point',
        coordinates: [-89.6501, 39.7817],
      },
      context: [
        { id: 'place.123', mapbox_id: 'place.123', text: 'Springfield', short_code: 'US-IL' },
        { id: 'region.123', mapbox_id: 'region.123', text: 'Illinois', short_code: 'US-IL' },
        { id: 'country.123', mapbox_id: 'country.123', text: 'United States', short_code: 'US' },
      ],
      address: '123',
    },
  ],
  attribution: '© Mapbox',
}

export const createMapboxHandler = (record: ContractInteractionRecorder) =>
  http.get('https://api.mapbox.com/geocoding/v5/mapbox.places/:query.json', ({ request, params }) => {
    const url = new URL(request.url)

    const token = url.searchParams.get('access_token')
    expect(token).toBeTruthy()

    record({
      provider: 'mapbox',
      name: 'Mapbox geocoding search',
      request: {
        method: request.method,
        url: request.url,
        headers: { authorization: request.headers.get('authorization') },
      },
      response: {
        status: 200,
        body: mapboxContractResponse,
      },
    })

    return HttpResponse.json(mapboxContractResponse)
  })
