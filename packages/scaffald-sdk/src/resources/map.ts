import { Resource } from './base.js'

export interface LocationCounts {
  workers: number
  jobs: number
  employers: number
  cached: boolean
}

export interface NearestResult {
  location: { lat: number; lng: number }
  label: string
  distance: number
  counts: {
    workers: number
    jobs: number
    employers: number
  }
}

export interface GetLocationCountsParams {
  city?: string
  state?: string
  north: number
  south: number
  east: number
  west: number
}

export interface FindNearestResultsParams {
  lat: number
  lng: number
  radius?: number
}

export class Map extends Resource {
  async getLocationCounts(params: GetLocationCountsParams): Promise<LocationCounts> {
    const query = new URLSearchParams({
      north: String(params.north),
      south: String(params.south),
      east: String(params.east),
      west: String(params.west),
    })
    if (params.city) query.set('city', params.city)
    if (params.state) query.set('state', params.state)
    return this.get<LocationCounts>(`/v1/map/location-counts?${query.toString()}`)
  }

  async findNearestResults(params: FindNearestResultsParams): Promise<NearestResult | null> {
    const query = new URLSearchParams({
      lat: String(params.lat),
      lng: String(params.lng),
    })
    if (params.radius) query.set('radius', String(params.radius))
    return this.get<NearestResult | null>(`/v1/map/find-nearest?${query.toString()}`)
  }
}
