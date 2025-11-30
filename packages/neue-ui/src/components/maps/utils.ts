import type { ViewportBounds } from './types'

/**
 * Generate a circle polygon GeoJSON feature
 * @param center - [longitude, latitude]
 * @param radiusMiles - Radius in miles
 * @param steps - Number of points to generate (default: 80 for smooth circle)
 * @returns GeoJSON Polygon feature
 */
export function generateCirclePolygon(
  center: [number, number],
  radiusMiles: number,
  steps = 80
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng, lat] = center
  const points: [number, number][] = []

  // Convert miles to degrees (approximate: 1 degree ≈ 69 miles at equator)
  // More accurate calculation would account for latitude, but this is sufficient for visualization
  const radiusDegrees = radiusMiles / 69

  // Generate points around the circle
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    const dx = radiusDegrees * Math.cos(angle)
    const dy = radiusDegrees * Math.sin(angle)

    // Account for latitude when calculating longitude distance
    const latAdjustment = Math.cos((lat * Math.PI) / 180)
    points.push([lng + dx / latAdjustment, lat + dy])
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [points],
    },
    properties: {},
  }
}

/**
 * Validate GeoJSON FeatureCollection structure
 */
export function validateGeoJSONFeatureCollection(data: unknown): data is GeoJSON.FeatureCollection {
  if (!data || typeof data !== 'object') {
    return false
  }

  const obj = data as Record<string, unknown>

  if (obj.type !== 'FeatureCollection') {
    return false
  }

  if (!Array.isArray(obj.features)) {
    return false
  }

  return obj.features.every((feature) => {
    if (!feature || typeof feature !== 'object') {
      return false
    }
    const f = feature as Record<string, unknown>
    return f.type === 'Feature' && f.geometry && f.properties
  })
}

/**
 * Extract viewport bounds from a Mapbox map instance
 * @throws Error if map bounds are not available
 */
export function extractViewportBounds(
  // biome-ignore lint/suspicious/noExplicitAny: mapboxgl.Map type not available in this context
  map: any
): ViewportBounds {
  const bounds = map.getBounds()
  if (!bounds) {
    throw new Error('Map bounds are not available')
  }
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  }
}
